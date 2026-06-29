import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Typography, Grid, Box, Paper, TextField, InputAdornment,
  FormGroup, FormControlLabel, Checkbox, Divider, Chip,
  MenuItem, Select, FormControl, InputLabel, Button, IconButton,
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterListIcon, Clear as ClearIcon,
  ChevronLeft, ChevronRight, NavigateBefore, NavigateNext,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/helpers';
import ProductCard from '../../components/shared/ProductCard';
import getProductImageUrl from '../../utils/productImages';

const CATEGORIES = [
  { id: 1, name: 'Abarrotes' },
  { id: 2, name: 'Lácteos' },
  { id: 3, name: 'Snacks' },
  { id: 4, name: 'Limpieza' },
  { id: 5, name: 'Bebidas' },
  { id: 6, name: 'Panadería' },
  { id: 7, name: 'Cuidado Personal' },
  { id: 8, name: 'Carnes' },
  { id: 9, name: 'Frutas y Verduras' },
  { id: 10, name: 'Mascotas' },
];

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('');

  const categories = CATEGORIES;
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/api/products?is_active=1')
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((p) => ({
          ...p,
          category: CATEGORIES.find((c) => c.id === p.category_id) || CATEGORIES[0],
        }));
        setProducts(mapped);
      })
      .catch(() => setProducts([]));
  }, []);

  const handleCategoryToggle = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setPriceMin('');
    setPriceMax('');
    setSortBy('');
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || priceMin || priceMax || sortBy;

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(p.category?.id);
      const matchesPriceMin = priceMin === '' || p.price >= Number(priceMin);
      const matchesPriceMax = priceMax === '' || p.price <= Number(priceMax);
      return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [products, search, selectedCategories, priceMin, priceMax, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, priceMin, priceMax, sortBy]);

  const offerProducts = useMemo(() => products.filter(p => p.offer_price && p.offer_price < p.price), [products]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const currentOffer = offerProducts[activeSlide];

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % (offerProducts.length || 1));
  }, [offerProducts.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + offerProducts.length) % (offerProducts.length || 1));
  }, [offerProducts.length]);

  useEffect(() => {
    if (!autoPlay || offerProducts.length === 0) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [autoPlay, nextSlide, offerProducts.length]);

  return (
    <Box sx={{ animation: 'fadeInUp 0.5s ease' }}>
      {offerProducts.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            color: '#fff',
            height: 300,
          }}
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${getProductImageUrl(currentOffer.image_url)}) center / cover`,
              transition: 'background 0.6s ease',
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              px: { xs: 3, md: 6 },
              height: '100%',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2, fontSize: '0.8rem' }}>
                Oferta especial — {Math.round(((currentOffer.price - currentOffer.offer_price) / currentOffer.price) * 100)}% de descuento
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 1.5 }}>
                {currentOffer.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography variant="h4" fontWeight={700}>
                  {formatCurrency(currentOffer.offer_price)}
                </Typography>
                <Typography variant="h6" sx={{ textDecoration: 'line-through', opacity: 0.7 }}>
                  {formatCurrency(currentOffer.price)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <IconButton
            onClick={prevSlide}
            sx={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              color: '#fff', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={nextSlide}
            sx={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              color: '#fff', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
            }}
          >
            <ChevronRight />
          </IconButton>

          <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1.5 }}>
            {offerProducts.map((_, i) => (
              <Box
                key={i}
                onClick={() => setActiveSlide(i)}
                sx={{
                  width: i === activeSlide ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={800} letterSpacing="-0.5px" gutterBottom>
          Catálogo de Productos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Descubre nuestra variedad de productos de calidad para ti y tu familia.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              position: 'sticky',
              top: 100,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Filtros
                </Typography>
              </Box>
              {hasActiveFilters && (
                <Button size="small" color="primary" onClick={clearFilters} startIcon={<ClearIcon />}>
                  Limpiar
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Categorías
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {categories.map((cat) => (
                <FormControlLabel
                  key={cat.id}
                  control={
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': { color: 'primary.main' },
                      }}
                    />
                  }
                  label={cat.name}
                  sx={{
                    '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 500 },
                  }}
                />
              ))}
            </FormGroup>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Rango de Precio
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                size="small"
                placeholder="Min"
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                sx={{ '& input': { fontSize: '0.85rem' } }}
                inputProps={{ min: 0, step: 0.1 }}
              />
              <Typography sx={{ alignSelf: 'center', color: 'text.secondary' }}>—</Typography>
              <TextField
                size="small"
                placeholder="Max"
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                sx={{ '& input': { fontSize: '0.85rem' } }}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="">Default</MenuItem>
                <MenuItem value="price-asc">Precio: menor a mayor</MenuItem>
                <MenuItem value="price-desc">Precio: mayor a menor</MenuItem>
                <MenuItem value="name-asc">Nombre: A — Z</MenuItem>
                <MenuItem value="name-desc">Nombre: Z — A</MenuItem>
              </Select>
            </FormControl>

            {selectedCategories.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedCategories.map((id) => (
                  <Chip
                    key={id}
                    label={categories.find((c) => c.id === id)?.name}
                    size="small"
                    onDelete={() => handleCategoryToggle(id)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar productos por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {filteredProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No se encontraron productos con los filtros actuales.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Intenta modificar tu búsqueda o quitar filtros.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {paginatedProducts.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
                  <IconButton
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <NavigateBefore />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    Página {page} de {totalPages}
                  </Typography>
                  <IconButton
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <NavigateNext />
                  </IconButton>
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
