const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const crypto = require('crypto')

const app = express()
const port = 3000

// Бүх төрлийн MIME төрлийг дэмжихээр 'raw' middleware ашиглаж байна.
// Ингэснээр webhook-аас ирсэн raw body-г авах боломжтой болно.
app.use('/byl/webhook', bodyParser.raw({ type: '*/*' }))

// Бусад route-д JSON өгөгдлийг авах боломжтой болно.
app.use(express.json())

// Byl API-ийн үндсэн тохиргооны хувьсагчууд
const BYL_BASE_URL = 'https://byl.mn'
const BYL_PROJECT_ID = '' // Төслийн ID-гаа оруулна уу.
const BYL_TOKEN = '' // API-н нууц токен оруулна уу.
const BYL_HASH_KEY = '' // Webhook шалгахад ашиглах түлхүүр оруулна уу.

app.get('/invoice', async (req, res) => {
  // Шинэ төлбөрийн нэхэмжлэх үүсгэх API дуудлага.
  const { data } = await axios({
    method: 'POST',
    url: `${BYL_BASE_URL}/api/v1/projects/${BYL_PROJECT_ID}/invoices`,
    headers: {
      Authorization: `Bearer ${BYL_TOKEN}`
    },
    data: {
      amount: 50, // Төлбөрийн дүн.
      description: 'First invoice' // Нэхэмжлэхийн тайлбар.
    },
  })

  // Хэрэглэгчийг нэхэмжлэхийн холбоос руу чиглүүлнэ.
  res.redirect(data.data.url)
})

app.post('/byl/webhook', (req, res) => {
  // Webhook-аас ирсэн raw body-г авах.
  const rawBody = req.body
  const payload = rawBody.toString() // Payload-ийг string хэлбэрт хөрвүүлж байна.
  let signature = req.headers['byl-signature'] // Webhook-аас ирсэн гарын үсэг (signature).

  // Webhook signature-г баталгаажуулах.
  // Byl-с ирсэн мэдээллийг бодит эсэхийг шалгахын тулд HMAC ашиглана.
  let computedSignature = crypto
    .createHmac('sha256', BYL_HASH_KEY) // Хэш үүсгэх түлхүүр ашиглаж байна.
    .update(payload) // Payload-ийг хэшлэж байна.
    .digest('hex') // Үр дүнг HEX формат руу хөрвүүлж байна.

  // Webhook signature тохирохгүй бол хандалтыг зөвшөөрөхгүй.
  if (computedSignature !== signature) {
    return res.status(403).send('Invalid signature') // 403 алдааны хариу илгээнэ.
  }

  // Signature зөв бол мэдээллийг боловсруулна.
  console.log('Event', JSON.parse(payload)) // Webhook-аас ирсэн мэдээллийг хэвлэж байна.

  res.send('Webhook received!') // Хариу илгээнэ.
})

// Серверийг 3000 порт дээр ажиллуулна.
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
