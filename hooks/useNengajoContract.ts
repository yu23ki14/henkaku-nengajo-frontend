import { BigNumber, ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import FowarderABI from '@/abi/Forwarder.json'
import PublicNengajoABI from '@/abi/PublicNengajo.json'
import { signMetaTxRequest } from '@/utils/signer'
import {
  useAccount,
  useContract,
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSigner
} from 'wagmi'
import { getContractAddress } from '@/utils/contractAddresses'
import { Nengajo } from '@/types'

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID)

const PUBLIC_NENGAJO_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_NENGAJO_ADDRESS!
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_FORWARDER_ADDRESS!
const AUTOTASK_WEBHOOK_URL =
  'https://api.defender.openzeppelin.com/autotasks/008e597e-1e35-436a-ad15-71a39c28cbde/runs/webhook/2dbd80b0-06b2-4b00-8468-612f6466e5e8/3BQpsKufqfkQbBearjpRFP'

const usePrepareNengajoContractWrite = (functionName: string, args: any[]) => {
  const { config } = usePrepareContractWrite({
    address: getContractAddress({ name: 'nengajo', chainId }),
    abi: PublicNengajoABI.abi,
    functionName,
    args,
    overrides: {
      gasLimit: BigNumber.from(450000)
    }
  })
  return config
}

const useNengajoContractRead = (functionName: string, args: unknown[] = []) => {
  const result = useContractRead({
    address: getContractAddress({ name: 'nengajo', chainId }),
    abi: PublicNengajoABI.abi,
    functionName,
    args
  })
  return result
}

const useNengajoContractEvent = (
  eventName: string,
  listener: (...args: any) => void
) => {
  useContractEvent({
    address: getContractAddress({ name: 'nengajo', chainId }),
    abi: PublicNengajoABI.abi,
    eventName,
    listener
  })
}

export const useMintNengajoWithMx = () => {
  const { data: signer } = useSigner()
  const nengajoContract = useContract({
    address: PUBLIC_NENGAJO_ADDRESS,
    abi: PublicNengajoABI.abi
  })
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setSuccess] = useState(false)

  useContractEvent({
    address: PUBLIC_NENGAJO_ADDRESS,
    abi: PublicNengajoABI.abi,
    eventName: 'Mint',
    listener: (minter: string, tokenId: BigNumber) => {
      if (minter === address && tokenId.toNumber() === 1) {
        setIsLoading(false)
        setSuccess(true)
      }
    }
  })

  const sendMetaTx = useCallback(async () => {
    try {
      if (!signer || !nengajoContract) return
      setIsLoading(true)

      const forwarder = new ethers.Contract(
        FORWARDER_ADDRESS,
        FowarderABI.abi,
        signer
      )

      const from = await signer.getAddress()
      const data = nengajoContract.interface.encodeFunctionData('mint', [1])
      const to = nengajoContract.address

      if (!signer.provider) throw new Error('Provider is not set')

      const request = await signMetaTxRequest(signer.provider, forwarder, {
        to,
        from,
        data
      })

      return fetch(AUTOTASK_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [signer])

  return { sendMetaTx, isLoading, isSuccess }
}

export const useCurrentSupply = () => {
  const { data, isError, isLoading } = useNengajoContractRead('totalSupply', [
    1
  ]) as { data: BigNumber; isLoading: boolean; isError: boolean }

  return { data, isError, isLoading }
}

export const useRetrieveNengajoByTokenId = (tokenId: number) => {
  const { data, isLoading, isError } = useNengajoContractRead(
    'retrieveRegisteredNengajo',
    [tokenId]
  ) as {
    data: Nengajo.NengajoInfoStructOutput
    isLoading: boolean
    isError: boolean
  }

  return { data, isLoading, isError }
}

export const useIsHoldingByTokenId = (tokenId: number) => {
  const [isHolding, setIsHolding] = useState(false)
  const { address } = useAccount()
  const { data, isError, isLoading } = useNengajoContractRead('balanceOf', [
    address,
    tokenId
  ]) as {
    data: BigNumber
    isLoading: boolean
    isError: boolean
  }

  useEffect(() => {
    if (data?.toNumber() > 0) {
      setIsHolding(true)
    } else {
      setIsHolding(false)
    }
  }, [data, address])

  return { isHolding, isLoading, isError }
}

export const useRegisterNengajo = (maxSupply: number, metadataURI: string) => {
  const [registeredTokenId, setRegisteredTokenId] = useState<number>()
  const config = usePrepareNengajoContractWrite('registerNengajo', [
    maxSupply,
    metadataURI || 'ipfs://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  ])
  const { data, isLoading, isSuccess, writeAsync } = useContractWrite(config)
  useNengajoContractEvent(
    'RegisterNengajo',
    (creator, _tokenId, metaDataURL, maxSupply) => {
      setRegisteredTokenId(_tokenId)
    }
  )

  return { data, isLoading, isSuccess, writeAsync, registeredTokenId }
}
