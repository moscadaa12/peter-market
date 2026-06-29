import { useState, useEffect } from 'react';
import {
  Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Button, TextField, InputAdornment, Box,
} from '@mui/material';
import { Search as SearchIcon, AddShoppingCart as AddShoppingCartIcon } from '@mui/icons-material';
import { formatCurrency } from '../../utils/helpers';
import getProductImageUrl from '../../utils/productImages';

// Catálogo público de productos (Home)
export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products?is_active=1')
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  return (
    <>
      {/* Encabezado del catálogo */}
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Nuestros Productos
      </Typography>

      {/* Barra de búsqueda */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Grid de productos */}
      {products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No hay productos disponibles en este momento.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products
            .filter((p) =>
              p.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getProductImageUrl(product.image_url)}
                    alt={product.name}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {product.description}
                    </Typography>
                    <Typography variant="h5" color="primary.main" fontWeight={700}>
                      {formatCurrency(product.price)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddShoppingCartIcon />}
                    >
                      Agregar al Carrito
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}
    </>
  );
}
