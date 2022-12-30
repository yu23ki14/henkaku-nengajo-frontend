import type { NextPage } from 'next'
import { useChainId, useMounted } from '@/hooks'
import Layout from '@/components/Layout'
import { useAccount } from 'wagmi'
import CreateNengajoForm from '@/components/CreateNengajo/Form'
import { Connect } from '@/components'
import { Heading } from '@chakra-ui/react'
import useTranslation from 'next-translate/useTranslation'
import { getContractAddress } from '@/utils/contractAddresses'

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const isMounted = useMounted()
  const { address, isConnected } = useAccount()
  const { chainId } = useChainId()

  const nengajo = getContractAddress({
    name: 'nengajo',
    chainId: chainId
  }) as `0x${string}`

  return (
    <Layout>
      <Heading as="h2">{t('CREATE_NEW_NENGAJO')}</Heading>
      {isMounted && !isConnected && <Connect />}
      {isMounted && isConnected && <CreateNengajoForm />}
    </Layout>
  )
}

export default Home
