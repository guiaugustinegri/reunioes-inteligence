// Configuração do EmailJS
// Para configurar:
// 1. Acesse https://www.emailjs.com/
// 2. Crie uma conta gratuita
// 3. Crie um serviço de e-mail (Gmail, Outlook, etc.)
// 4. Crie um template de e-mail
// 5. Substitua os valores abaixo pelos seus

export const EMAILJS_CONFIG = {
  // Seu Service ID
  SERVICE_ID: 'service_w3lwi8n',
  
  // Seu Template ID
  TEMPLATE_ID: 'template_8m6bwsc',
  
  // Sua Public Key
  PUBLIC_KEY: 'EWYOBpMoanI-OUhzI'
}

// Template de e-mail sugerido para o EmailJS:
/*
Assunto: {{subject}}

Olá,

Segue o resumo da reunião conforme solicitado:

{{message}}

Atenciosamente,
Powered by Traction Resumer v0.1
*/

// IMPORTANTE: Configure este template no EmailJS com exatamente estes parâmetros:
// - {{to_email}} - E-mail do destinatário
// - {{subject}} - Assunto do e-mail  
// - {{message}} - Conteúdo HTML do resumo
// - {{from_name}} - Nome do remetente
