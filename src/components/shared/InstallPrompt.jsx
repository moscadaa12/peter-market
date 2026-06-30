import { useEffect, useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Download as DownloadIcon, Close as CloseIcon } from '@mui/icons-material';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999,
        bgcolor: 'primary.main', color: '#fff', borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
      }}
    >
      <DownloadIcon />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>Instalar Peter Market</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Agrega la app a tu pantalla de inicio
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="small"
        onClick={handleInstall}
        sx={{ bgcolor: '#fff', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: 'grey.200' } }}
      >
        Instalar
      </Button>
      <CloseIcon
        fontSize="small"
        onClick={() => setShow(false)}
        sx={{ cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1 } }}
      />
    </Box>
  );
}
