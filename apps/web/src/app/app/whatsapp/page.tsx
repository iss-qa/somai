'use client'

import { useState } from 'react'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import {
  MessageCircle,
  Wifi,
  WifiOff,
  Send,
  Phone,
  QrCode,
  Loader2,
  CheckCircle,
  Settings,
} from 'lucide-react'

function WhatsAppContent() {
  const [connected, setConnected] = useState(false)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [autoReply, setAutoReply] = useState(false)

  async function handleSendTest() {
    if (!testNumber || !testMessage) {
      toast.error('Preencha o numero e a mensagem')
      return
    }
    setSending(true)
    try {
      // Simulated API call
      await new Promise((r) => setTimeout(r, 1500))
      toast.success('Mensagem de teste enviada!')
      setTestMessage('')
    } catch {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">WhatsApp</h2>
        <p className="text-sm text-gray-400 mt-1">
          Conecte e gerencie seu WhatsApp Business
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connection status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-400" />
              Status da Conexao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-brand-surface border border-brand-border">
              <div className="flex items-center gap-3">
                {connected ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {connected ? 'Conectado' : 'Desconectado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {connected
                      ? 'WhatsApp Business ativo'
                      : 'Escaneie o QR Code para conectar'}
                  </p>
                </div>
              </div>
              <Badge variant={connected ? 'success' : 'destructive'}>
                {connected ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {!connected && (
              <div className="text-center py-8">
                <div className="w-48 h-48 mx-auto rounded-xl bg-white p-4 mb-4 flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-800" />
                </div>
                <p className="text-sm text-gray-400">
                  Escaneie com o WhatsApp no seu celular
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setConnected(true)}
                >
                  Simular conexao
                </Button>
              </div>
            )}

            {connected && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Resposta automática</p>
                    <p className="text-xs text-gray-500">
                      Responder automaticamente fora do horario
                    </p>
                  </div>
                  <Switch checked={autoReply} onCheckedChange={setAutoReply} />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConnected(false)}
                >
                  Desconectar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary-400" />
              Enviar Mensagem de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Numero (com DDD)</Label>
              <Input
                placeholder="11999999999"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                disabled={!connected}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-lg border border-gray-800 bg-brand-surface px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Digite a mensagem de teste..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                disabled={!connected}
              />
            </div>

            <Button
              className="w-full gap-2"
              disabled={!connected || sending || !testNumber || !testMessage}
              onClick={handleSendTest}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar teste
                </>
              )}
            </Button>

            {!connected && (
              <p className="text-xs text-gray-500 text-center">
                Conecte o WhatsApp primeiro para enviar mensagens
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function WhatsAppPage() {
  return (
    <FeatureGate feature="Integração WhatsApp">
      <WhatsAppContent />
    </FeatureGate>
  )
}
