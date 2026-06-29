const images = import.meta.glob('./*', { eager: true, query: '?url', import: 'default' })

export const productImageMap = Object.fromEntries(
  Object.entries(images).map(([path, url]) => {
    const name = path.replace('./', '')
    return [name, url]
  })
)

export function getProductImage(name) {
  return productImageMap[name]
}

export default productImageMap
