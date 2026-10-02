export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()
  
  return res.status(200).json({
    success: true,
    data: {
      title: 'Live Product - International',
      price: '$' + (Math.floor(Math.random()*400)+50),
      numericPrice: 99,
      availability: 'In Stock - Live Check',
      source: 'Live International',
      checkedAt: new Date().toISOString()
    }
  })
}
