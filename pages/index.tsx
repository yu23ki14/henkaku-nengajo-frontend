import { Connect } from '@/components'
import CountDown from '@/components/CountDown'
import GlobalIcon from '@/components/Icon/Global'
import Layout from '@/components/Layout'
import SecretMessage from '@/components/MintNengajo/SecretMessage'
import { useChainId, useMounted } from '@/hooks'
import { useCountdown } from '@/hooks/useCountdown'
import {
  useCurrentSupply,
  useIsHoldingByTokenId,
  useMintNengajoWithMx,
  useRetrieveNengajoByTokenId
} from '@/hooks/useNengajoContract'
import { useNengajoInfo } from '@/hooks/useNengajoInfo'
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text,
  useToast
} from '@chakra-ui/react'
import setLanguage from 'next-translate/setLanguage'
import useTranslation from 'next-translate/useTranslation'
import Image from 'next/image'
import { FC, useMemo } from 'react'
import { useAccount, useSwitchNetwork } from 'wagmi'

const CountDownElm: FC = () => {
  const { t, lang } = useTranslation('common')
  const { isStart, ...countDown } = useCountdown()
  return (
    <Box textAlign="center">
      <Heading
        size="lg"
        mb={10}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <span className="text_nengajo">{t('NENGAJO')}</span>
        <Button
          ml={2}
          size="md"
          onClick={async () => await setLanguage(lang == 'en' ? 'ja' : 'en')}
        >
          <GlobalIcon />
        </Button>
      </Heading>

      <Text fontSize="24px" fontWeight="bold" lineHeight={2}>
        {isStart ? (
          <>
            {t('TOP_MINT_START_AKEOME')}
            <br />
            {t('TOP_MINT_START_READY')}
          </>
        ) : (
          <>{t('TOP_UNTIL_START')}</>
        )}
      </Text>
      {!isStart && <CountDown data={countDown} />}
    </Box>
  )
}

const Entity = () => {
  const { t } = useTranslation('common')
  const { isConnected, address } = useAccount()
  const {
    sendMetaTx,
    isLoading: isLoadingTx,
    isSuccess
  } = useMintNengajoWithMx()
  const { data: currentSupply, isLoading: isLoadingCurrentSupply } =
    useCurrentSupply()
  const { isHolding, isLoading: isLoadingHold } = useIsHoldingByTokenId(1)
  const { wrongNetwork, chainId } = useChainId()
  const { switchNetworkAsync, status: switchNetworkStatus } = useSwitchNetwork({
    chainId: 137
  })
  const toast = useToast()
  const tokenInfo = useRetrieveNengajoByTokenId(1)
  const { nengajoInfo } = useNengajoInfo(tokenInfo.data)

  const switchOrAddNetwork = async () => {
    if (!switchNetworkAsync || !window.ethereum) return
    try {
      await switchNetworkAsync(Number(process.env.NEXT_PUBLIC_CHAIN_ID!))
    } catch (error) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x' + chainId.toString(16),
            blockExplorerUrls: ['https://polygonscan.com'],
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
              decimals: 18,
              name: 'Polygon',
              symbol: 'MATIC'
            },
            rpcUrls: ['https://polygon-rpc.com']
          }
        ]
      })
      await switchNetworkAsync(Number(process.env.NEXT_PUBLIC_CHAIN_ID!))
    }
  }

  const submit = async () => {
    try {
      await sendMetaTx()
      return
    } catch (error: any) {
      console.log(error)
      toast({
        id: 'MINT_NENGAJO_MTX_FAILED',
        title: error?.message,
        status: 'error',
        duration: 5000,
        position: 'top'
      })
    }
  }

  const showNFTImage = useMemo(() => {
    if (isHolding || currentSupply?.toNumber() === 100 || isSuccess) {
      return true
    } else {
      return false
    }
  }, [isHolding, currentSupply, isSuccess])

  const ButtonElm: FC = () => {
    if (isConnected && wrongNetwork && switchNetworkAsync) {
      return (
        <Button
          size="lg"
          colorScheme="teal"
          borderRadius="full"
          onClick={() => switchOrAddNetwork()}
          isLoading={switchNetworkStatus === 'loading'}
        >
          Change Network
        </Button>
      )
    } else if (isConnected) {
      return (
        <Button
          size="lg"
          colorScheme="teal"
          borderRadius="full"
          onClick={submit}
          isLoading={isLoadingTx}
        >
          Mint Nengajo NFT
        </Button>
      )
    } else {
      return <Connect />
    }
  }

  return (
    <Layout disableHeader>
      <CountDownElm />

      <Grid gridTemplateColumns={{ md: '1fr 1fr' }} my={8} columnGap={5}>
        <Box filter={showNFTImage ? 'none' : 'blur(10px)'}>
          <Image width="400px" height="400px" src="/nengajo.jpg" />
        </Box>

        <Flex justifyContent="center" alignItems="center" textAlign="center">
          <Box>
            <Text fontSize="18px" fontWeight="bold">
              {isLoadingCurrentSupply ? (
                <Spinner />
              ) : (
                `${currentSupply?.toNumber()} / 100`
              )}
            </Text>
            <Text fontSize="18px" fontWeight="bold" mb={10}>
              Wallet Address: {address?.substring(0, 10)}...
            </Text>

            {showNFTImage ? (
              <Text>
                {t('THANK_YOU_FOR_MINT')}
                <br />
                {t('GREET_THIS_YEAR')}
              </Text>
            ) : (
              <ButtonElm />
            )}

            {showNFTImage && <SecretMessage metadata={nengajoInfo} />}
          </Box>
        </Flex>
      </Grid>
    </Layout>
  )
}

const PodcastMintPage: FC = () => {
  const isMounted = useMounted()

  return isMounted ? <Entity /> : <></>
}

export default PodcastMintPage
