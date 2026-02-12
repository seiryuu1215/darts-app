import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function DartCardSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={140} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={60} />
        </Box>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </CardContent>
    </Card>
  );
}
