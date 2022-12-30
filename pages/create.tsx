import type { NextPage } from 'next'
import { useMounted } from '@/hooks'
import Layout from '@/components/Layout'
import { useAccount } from 'wagmi'
import CreateNengajoForm from '@/components/CreateNengajo/Form'
import { Connect } from '@/components'
import { Heading } from '@chakra-ui/react'
import useTranslation from 'next-translate/useTranslation'

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const isMounted = useMounted()
  const { isConnected } = useAccount()

  return (
    <Layout>
      <Heading as="h2">{t('CREATE_NEW_NENGAJO')}</Heading>
      {isMounted && !isConnected && <Connect />}
      {isMounted && isConnected && <CreateNengajoForm />}
    </Layout>
  )
}

export default Home
