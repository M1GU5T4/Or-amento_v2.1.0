// Gerar PDF do orçamento com Google AI + Puppeteer
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar os dados do orçamento
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        lineItems: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // 2. Configurar e chamar a API do Google AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um assistente especialista em gerar documentos financeiros profissionais.
      Recebi os seguintes dados de um orçamento em formato JSON.
      Sua tarefa é gerar um documento HTML completo e bem formatado para este orçamento.

      **Regras:**
      - O HTML deve ser "standalone", com todo o CSS embutido em uma tag <style> no <head>.
      - Use um design limpo e profissional. A fonte principal deve ser 'Helvetica' ou 'Arial'.
      - Inclua um cabeçalho com as informações da empresa "HE SEGURANÇA ELETRÔNICA", CNPJ "XX.XXX.XXX/0001-XX" e contato "contato@heseguranca.com".
      - Apresente os dados do cliente e os detalhes do orçamento (número, datas).
      - Crie uma tabela para os itens, com colunas: Descrição, Quantidade, Preço Unitário, Total.
      - Calcule e mostre o Subtotal, Taxas (se houver) e o Total Geral.
      - Inclua a seção de "Observações" se ela existir nos dados.
      - Adicione um rodapé com uma mensagem de agradecimento e dados bancários para pagamento (PIX: XX.XXX.XXX/0001-XX).
      - Formate todos os valores monetários para o padrão brasileiro (R$).
      - Formate as datas para o padrão DD/MM/AAAA.
      - **NÃO** inclua a tag \`\`\`html no início ou no fim da sua resposta. A resposta deve ser apenas o código HTML, começando com \`<!DOCTYPE html>\`.

      **Dados do Orçamento (JSON):**
      ${JSON.stringify(quote, null, 2)}

      Agora, gere o HTML completo.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const htmlContent = response.text();

    // 3. Usar Puppeteer para converter o HTML gerado em PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Define o conteúdo da página como o HTML gerado pela IA
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Gera o PDF a partir da página
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // 4. Enviar o PDF para o cliente
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orcamento-${quote.quoteNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    res.status(500).json({ error: 'Erro interno ao gerar PDF' });
  }
});