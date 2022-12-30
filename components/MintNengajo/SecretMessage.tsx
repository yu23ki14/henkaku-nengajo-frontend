import { useLitDecryption } from '@/hooks/useLitProtocol'
import { useRetrieveNengajoByTokenId } from '@/hooks/useNengajoContract'
import { NengajoInfoProps, useNengajoInfo } from '@/hooks/useNengajoInfo'
import {
  Box,
  Button,
  Divider,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { FC, useCallback, useMemo, useState } from 'react'

type Props = {
  metadata?: NengajoInfoProps
}

const SecretMessage: FC<Props> = ({ metadata }) => {
  const { decrypt } = useLitDecryption(1)
  const [message, setMessage] = useState<string>()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const decryptMessage = useCallback(async () => {
    if (!message) {
      const decryptedMessage = await decrypt(
        metadata?.tokenURIJSON.encryptedFile!,
        metadata?.tokenURIJSON.encryptedSymmetricKey!
      )
      let binary = ''
      const bytes = new Uint8Array(decryptedMessage?.decryptedFile)
      const len = bytes.byteLength
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      setMessage(window.btoa(binary))
    }
    onOpen()
  }, [decrypt, metadata])

  return (
    <Box>
      <Divider my={5} />
      <Button
        onClick={() => decryptMessage()}
        colorScheme="teal"
        height="auto"
        py={2}
        lineHeight={1.4}
        isLoading={!metadata}
        disabled={!metadata}
      >
        NFTホルダー限定の
        <br />
        メッセージ・カードをみる
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <Box py={5}>
              <Image
                margin="0 auto"
                src={`data:image;base64, ${message}`}
                alt=""
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default SecretMessage
