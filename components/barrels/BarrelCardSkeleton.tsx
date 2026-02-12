import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function BarrelCardSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={140} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="50%" />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
          <Skeleton variant="rounded" width={50} height={20} />
          <Skeleton variant="rounded" width={50} height={20} />
          <Skeleton variant="rounded" width={50} height={20} />
        </Box>
      </CardContent>
    </Card>
  );
}
