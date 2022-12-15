import { useLitDecryption, useLitEncryption } from '@/hooks/useLitProtocol'
import { Button } from '@chakra-ui/react'
import { NextPage } from 'next'
import { useState } from 'react'

const LitTest: NextPage = () => {
  const { encrypt } = useLitEncryption()
  const { decrypt } = useLitDecryption()

  const [encryptedString, setEncryptedString] = useState('')
  const [key, setkey] = useState('')

  const encryption = async () => {
    const res = await encrypt()
    if (!res) return
    setEncryptedString(res.encryptedString)
    setkey(res.encryptedSymmetricKey)
  }

  const decryption = async () => {
    const res = await decrypt(encryptedString, key)
    console.log(res)
  }

  return (
    <div>
      <Button onClick={() => encryption()}>Enc</Button>
      <Button onClick={() => decryption()}>Dec</Button>
    </div>
  )
}

export default LitTest
