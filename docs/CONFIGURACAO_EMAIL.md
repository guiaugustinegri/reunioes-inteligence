# 📧 Configuração do Envio de E-mails

## 🚀 EmailJS - Serviço Gratuito

O EmailJS permite enviar e-mails diretamente do frontend sem precisar de backend. É **100% gratuito** para até 200 e-mails por mês.

## 📋 Passo a Passo

### 1. Criar Conta no EmailJS
1. Acesse: https://www.emailjs.com/
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu e-mail

### 2. Configurar Serviço de E-mail
1. No dashboard, vá em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha seu provedor:
   - **Gmail** (recomendado)
   - **Outlook**
   - **Yahoo**
   - **Outros**
4. Siga as instruções para conectar sua conta
5. **Anote o Service ID** (ex: `service_abc123`)

### 3. Criar Template de E-mail
1. Vá em **"Email Templates"**
2. Clique em **"Create New Template"**
3. Use este template sugerido:

```html
Assunto: {{subject}}

Olá,

Segue o resumo da reunião conforme solicitado:

{{message}}

---
Detalhes da Reunião:
- Título: {{reuniao_titulo}}
- Empresa: {{empresa}}
- Produto: {{produto}}
- Data: {{data}}

Atenciosamente,
[Seu Nome]
```

4. **Anote o Template ID** (ex: `template_xyz789`)

### 4. Obter Public Key
1. Vá em **"Account"** → **"General"**
2. **Anote a Public Key** (ex: `user_abc123def456`)

### 5. Configurar no App
1. Abra o arquivo: `src/config/emailjs.js`
2. Substitua os valores:

```javascript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_abc123',        // Seu Service ID
  TEMPLATE_ID: 'template_xyz789',      // Seu Template ID
  PUBLIC_KEY: 'user_abc123def456'      // Sua Public Key
}
```

## ✅ Pronto!

Agora o botão "Enviar E-mail" na página de Resumo IA funcionará perfeitamente!

## 🎯 Como Usar

1. Na lista de reuniões → Clique em "Resumo IA"
2. Clique em "Enviar E-mail"
3. **NOVO**: Marque o checkbox "Incluir Resumo Conciso acima do template" (opcional)
4. Digite o e-mail do destinatário
5. Personalize o assunto (opcional)
6. Clique em "Enviar"
7. O e-mail será enviado automaticamente!

## 📋 Resumo Conciso

### ✅ Funcionalidade Implementada

Agora você pode incluir o **Resumo Conciso** no e-mail:

- **Checkbox**: "Incluir Resumo Conciso acima do template"
- **Posição**: Aparece no início do e-mail, antes do resumo IA completo
- **Estilo**: Segue o design system do projeto (bordas pretas, fonte Courier New)
- **Condição**: Só aparece se a reunião tiver um resumo conciso cadastrado

### 🎨 Como Fica no E-mail

Quando marcado, o e-mail terá esta estrutura:

```
┌─────────────────────────────────────┐
│ RESUMO CONCISO                      │
│ [Conteúdo do resumo conciso]        │
└─────────────────────────────────────┘

[Resumo IA completo em HTML]
```

### 🔧 Template Recomendado

Para melhor compatibilidade, use este template no EmailJS:

```html
Assunto: {{subject}}

Olá,

Segue o resumo da reunião conforme solicitado:

{{message}}

---
Detalhes da Reunião:
- Título: {{reuniao_titulo}}
- Empresa: {{empresa}}
- Produto: {{produto}}
- Data: {{data}}

Atenciosamente,
[Seu Nome]
```

**Nota**: O `{{message}}` já inclui o resumo conciso (se selecionado) + o resumo IA completo.

## 🔧 Alternativas

Se preferir outras opções:

### Resend (Recomendado para produção)
- Mais profissional
- 3.000 e-mails gratuitos/mês
- API simples
- https://resend.com/

### SendGrid
- Muito popular
- 100 e-mails gratuitos/dia
- https://sendgrid.com/

### Nodemailer (Backend)
- Para quem tem servidor
- Mais controle
- https://nodemailer.com/

## 🆘 Suporte

Se tiver problemas:
1. Verifique se as chaves estão corretas
2. Teste o template no EmailJS
3. Verifique o console do navegador
4. Confirme se o serviço de e-mail está ativo

---

**EmailJS é a opção mais simples e rápida para começar!** 🚀
