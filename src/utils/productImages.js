import productImages from '../assets/images/products/index.js'

const allImages = Object.values(productImages)
const DEFAULT_IMAGE = allImages[0] || ''
const UPLOADED_PATTERN = /^product-\d+\./

export default function getProductImageUrl(imageUrl) {
  if (!imageUrl) return DEFAULT_IMAGE

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (imageUrl.startsWith('/images/products/')) {
    const filename = imageUrl.replace('/images/products/', '')

    if (productImages[filename]) {
      return productImages[filename]
    }

    if (UPLOADED_PATTERN.test(filename)) {
      return imageUrl
    }

    return DEFAULT_IMAGE
  }

  return imageUrl
}
