import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Chip, Box,
} from '@mui/material';
import { AddShoppingCart as AddShoppingCartIcon } from '@mui/icons-material';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/helpers';
import getProductImageUrl from '../../utils/productImages';

export default function ProductCard({ product, sx }) {
  const { addToCart } = useCart();

  const { id, name, description, price, offer_price, image_url, category } = product;
  const hasOffer = offer_price && offer_price < price;
  const discountPercent = hasOffer ? Math.round(((price - offer_price) / price) * 100) : 0;

  const handleAdd = () => {
    addToCart({ id, name, price: hasOffer ? offer_price : price, image_url });
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          '& .product-card-media': {
            transform: 'scale(1.05)',
          },
        },
        ...sx,
      }}
    >
      <Box sx={{ overflow: 'hidden', position: 'relative' }}>
        <CardMedia
          className="product-card-media"
          component="img"
          height="200"
          image={getProductImageUrl(image_url)}
          alt={name}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {category && (
          <Chip
            label={typeof category === 'string' ? category : category.name}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}
        {hasOffer && (
          <Chip
            label={`-${discountPercent}%`}
            size="small"
            color="error"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography
          variant="h6"
          gutterBottom
          noWrap
          fontWeight={600}
          sx={{ fontSize: '0.95rem' }}
        >
          {name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          {hasOffer ? (
            <>
              <Typography variant="h5" color="error.main" fontWeight={700}>
                {formatCurrency(offer_price)}
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(price)}
              </Typography>
            </>
          ) : (
            <Typography variant="h5" color="primary.main" fontWeight={700}>
              {formatCurrency(price)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<AddShoppingCartIcon />}
          onClick={handleAdd}
          sx={{ py: 1 }}
        >
          Agregar al Carrito
        </Button>
      </CardActions>
    </Card>
  );
}
