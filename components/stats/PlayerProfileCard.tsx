'use client';

import { Paper, Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import AdjustIcon from '@mui/icons-material/Adjust';
import PlaceIcon from '@mui/icons-material/Place';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface PlayerProfileCardProps {
  cardName: string;
  cardImageUrl: string;
  toorina: string;
  homeShop?: string;
  myAward?: string;
  status?: string;
  flightColor: string;
}

export default function PlayerProfileCard({
  cardName,
  cardImageUrl,
  toorina,
  homeShop,
  myAward,
  status,
  flightColor,
}: PlayerProfileCardProps) {
  const mapUrl = homeShop
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(homeShop + ' ダーツ')}`
    : null;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {cardImageUrl ? (
          <Avatar
            src={cardImageUrl}
            alt={cardName}
            sx={{ width: 64, height: 64, border: `2px solid ${flightColor}` }}
          />
        ) : (
          <Avatar sx={{ width: 64, height: 64, bgcolor: flightColor }}>
            <AdjustIcon sx={{ fontSize: 32 }} />
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.3 }} noWrap>
            {cardName}
          </Typography>
          {toorina && (
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              @{toorina}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {homeShop && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PlaceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
              {homeShop}
            </Typography>
            {mapUrl && (
              <Tooltip title="Google Maps で開く">
                <IconButton
                  size="small"
                  component="a"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: 12 }}
                >
                  <PlaceIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
        {myAward && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 16, color: '#ffc107' }} />
            <Typography variant="caption" color="text.secondary">
              My Award: {myAward}
            </Typography>
          </Box>
        )}
        {status && (
          <Chip
            label={status}
            size="small"
            variant="outlined"
            sx={{ alignSelf: 'flex-start', mt: 0.5 }}
          />
        )}
      </Box>
    </Paper>
  );
}
