'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Paper,
  Autocomplete,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import type { BarrelSearchResult, BarrelProduct } from '@/types';
import { collection, setDoc, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Dart } from '@/types';
import {
  TIPS,
  SHAFTS,
  FLIGHTS,
  CONDOR_AXE,
  BARREL_CUTS,
  checkShaftFlightCompatibility,
} from '@/lib/darts-parts';
import type { TipSpec, ShaftSpec, FlightSpec, CondorAxeSpec } from '@/lib/darts-parts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DartFormProps {
  initialData?: Dart;
  dartId?: string;
  isDraft?: boolean;
  draftBarrelImageUrl?: string;
}

export default function DartForm({
  initialData,
  dartId,
  isDraft,
  draftBarrelImageUrl,
}: DartFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isEdit = !!dartId;

  // バレル
  const [title, setTitle] = useState(initialData?.title || '');
  const [barrelName, setBarrelName] = useState(initialData?.barrel.name || '');
  const [barrelBrand, setBarrelBrand] = useState(initialData?.barrel.brand || '');
  const [barrelWeight, setBarrelWeight] = useState(initialData?.barrel.weight?.toString() || '');
  const [barrelMaxDiameter, setBarrelMaxDiameter] = useState(
    initialData?.barrel.maxDiameter?.toString() || '',
  );
  const [barrelLength, setBarrelLength] = useState(initialData?.barrel.length?.toString() || '');
  const [barrelCut, setBarrelCut] = useState<string[]>(
    initialData?.barrel.cut ? initialData.barrel.cut.split(/\s*[+＋、,/]\s*/).filter(Boolean) : [],
  );

  // チップ
  const [selectedTip, setSelectedTip] = useState<TipSpec | null>(
    initialData?.tip.name ? TIPS.find((t) => t.name === initialData.tip.name) || null : null,
  );
  const [tipCustomName, setTipCustomName] = useState(
    initialData?.tip.name && !TIPS.find((t) => t.name === initialData.tip.name)
      ? initialData.tip.name
      : '',
  );
  const [tipCustomType, setTipCustomType] = useState<'soft' | 'steel'>(
    initialData?.tip.type || 'soft',
  );
  const [tipCustomLength, setTipCustomLength] = useState(
    initialData?.tip.lengthMm?.toString() || '',
  );
  const [tipCustomWeight, setTipCustomWeight] = useState(
    initialData?.tip.weightG?.toString() || '',
  );
  const [tipIsCustom, setTipIsCustom] = useState(
    !!initialData?.tip.name && !TIPS.find((t) => t.name === initialData.tip.name),
  );

  // CONDOR AXEモード
  const [useCondorAxe, setUseCondorAxe] = useState(initialData?.flight.isCondorAxe || false);
  const [selectedCondorAxe, setSelectedCondorAxe] = useState<CondorAxeSpec | null>(null);

  // シャフト（通常モード）
  const [selectedShaft, setSelectedShaft] = useState<ShaftSpec | null>(
    initialData?.shaft.name && !initialData?.flight.isCondorAxe
      ? SHAFTS.find((s) => s.name === initialData.shaft.name) || null
      : null,
  );
  const [shaftCustomName, setShaftCustomName] = useState('');
  const [shaftCustomLength, setShaftCustomLength] = useState('');
  const [shaftCustomWeight, setShaftCustomWeight] = useState('');
  const [shaftIsCustom, setShaftIsCustom] = useState(false);

  // フライト（通常モード）
  const [selectedFlight, setSelectedFlight] = useState<FlightSpec | null>(
    initialData?.flight.name && !initialData?.flight.isCondorAxe
      ? FLIGHTS.find((f) => f.name === initialData.flight.name) || null
      : null,
  );
  const [flightCustomName, setFlightCustomName] = useState('');
  const [flightCustomShape, setFlightCustomShape] = useState('standard');
  const [flightCustomWeight, setFlightCustomWeight] = useState('');
  const [flightIsCustom, setFlightIsCustom] = useState(false);

  // 共通
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarrelSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [barrelsLoaded, setBarrelsLoaded] = useState(false);

  // 初期データからカスタム状態を復元
  useEffect(() => {
    if (
      initialData?.shaft.name &&
      !SHAFTS.find((s) => s.name === initialData.shaft.name) &&
      !initialData?.flight.isCondorAxe
    ) {
      setShaftIsCustom(true);
      setShaftCustomName(initialData.shaft.name);
      setShaftCustomLength(initialData.shaft.lengthMm?.toString() || '');
      setShaftCustomWeight(initialData.shaft.weightG?.toString() || '');
    }
    if (
      initialData?.flight.name &&
      !FLIGHTS.find((f) => f.name === initialData.flight.name) &&
      !initialData?.flight.isCondorAxe
    ) {
      setFlightIsCustom(true);
      setFlightCustomName(initialData.flight.name);
      setFlightCustomShape(initialData.flight.shape || 'standard');
      setFlightCustomWeight(initialData.flight.weightG?.toString() || '');
    }
    if (initialData?.flight.isCondorAxe) {
      setUseCondorAxe(true);
      const match = CONDOR_AXE.find(
        (c) =>
          c.shaftLengthMm === initialData.flight.condorAxeShaftLengthMm &&
          initialData.flight.name.includes(
            c.shape === 'standard' ? 'スタンダード' : c.shape === 'small' ? 'スモール' : 'スリム',
          ),
      );
      if (match) setSelectedCondorAxe(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // トータル計算
  const totals = useMemo(() => {
    const bWeight = Number(barrelWeight) || 0;
    const bLength = Number(barrelLength) || 0;

    let tipLen = 0;
    let tipW = 0;
    if (tipIsCustom) {
      tipLen = Number(tipCustomLength) || 0;
      tipW = Number(tipCustomWeight) || 0;
    } else if (selectedTip) {
      tipLen = selectedTip.lengthMm;
      tipW = selectedTip.weightG;
    }

    // スティールはバレル重量にポイント重量が含まれるため加算しない
    const isSteel = tipCustomType === 'steel';
    const tipWForTotal = isSteel ? 0 : tipW;

    let shaftLen = 0;
    let shaftW = 0;
    let flightW = 0;

    if (useCondorAxe && selectedCondorAxe) {
      shaftLen = selectedCondorAxe.shaftLengthMm;
      // CONDOR AXEはシャフト+フライト一体型の重さ
      flightW = selectedCondorAxe.totalWeightG;
      shaftW = 0; // 一体型なのでフライト側に含む
    } else {
      if (shaftIsCustom) {
        shaftLen = Number(shaftCustomLength) || 0;
        shaftW = Number(shaftCustomWeight) || 0;
      } else if (selectedShaft) {
        shaftLen = selectedShaft.lengthMm;
        shaftW = selectedShaft.weightG;
      }
      if (flightIsCustom) {
        flightW = Number(flightCustomWeight) || 0;
      } else if (selectedFlight) {
        flightW = selectedFlight.weightG;
      }
    }

    const totalLength = tipLen + bLength + shaftLen;
    const totalWeight = bWeight + tipWForTotal + shaftW + flightW;

    return {
      totalLength: totalLength > 0 ? totalLength : null,
      totalWeight: totalWeight > 0 ? totalWeight : null,
      tipLen,
      tipW,
      shaftLen,
      shaftW,
      flightW,
    };
  }, [
    barrelWeight,
    barrelLength,
    selectedTip,
    tipIsCustom,
    tipCustomLength,
    tipCustomWeight,
    tipCustomType,
    useCondorAxe,
    selectedCondorAxe,
    selectedShaft,
    shaftIsCustom,
    shaftCustomLength,
    shaftCustomWeight,
    selectedFlight,
    flightIsCustom,
    flightCustomWeight,
  ]);

  // ドラフトモード: バレル画像を自動取得
  useEffect(() => {
    if (draftBarrelImageUrl && newImages.length === 0 && imageUrls.length === 0) {
      (async () => {
        try {
          const { fetchImageWithFallback } = await import('@/lib/image-proxy');
          const blob = await fetchImageWithFallback(draftBarrelImageUrl);
          if (!blob) return;
          const fileName = draftBarrelImageUrl.split('/').pop() || 'barrel.jpg';
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          setNewImages([file]);
        } catch {
          /* ignore */
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftBarrelImageUrl]);

  // ダイアログオープン時にFirestoreからバレルデータをロード
  useEffect(() => {
    if (searchOpen && !barrelsLoaded) {
      getDocs(collection(db, 'barrels'))
        .then((snapshot) => {
          setAllBarrels(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BarrelProduct));
          setBarrelsLoaded(true);
        })
        .catch(() => {
          setError('バレルデータの取得に失敗しました');
        });
    }
  }, [searchOpen, barrelsLoaded]);

  const handleBarrelSearch = () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const q = searchQuery.toLowerCase();
    const matches = allBarrels
      .filter((b) => b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q))
      .slice(0, 20);
    setSearchResults(
      matches.map((b) => ({
        name: b.name,
        brand: b.brand,
        weight: b.weight,
        maxDiameter: b.maxDiameter,
        length: b.length,
        cut: b.cut,
        imageUrl: b.imageUrl || undefined,
      })),
    );
    setSearching(false);
  };

  const handleSelectBarrel = async (result: BarrelSearchResult) => {
    setBarrelName(result.name);
    if (result.brand) setBarrelBrand(result.brand);
    if (result.weight) setBarrelWeight(result.weight.toString());
    if (result.maxDiameter) setBarrelMaxDiameter(result.maxDiameter.toString());
    if (result.length) setBarrelLength(result.length.toString());
    if (result.cut) setBarrelCut(result.cut.split(/\s*[+＋、,/]\s*/).filter(Boolean));
    setSearchOpen(false);
    setSearchResults([]);
    setSearchQuery('');

    if (result.imageUrl && imageUrls.length + newImages.length < 3) {
      try {
        const { fetchImageWithFallback } = await import('@/lib/image-proxy');
        const blob = await fetchImageWithFallback(result.imageUrl);
        if (blob) {
          const fileName = result.imageUrl.split('/').pop() || 'barrel.jpg';
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          setNewImages((prev) => [file, ...prev]);
        }
      } catch {
        // 画像取得失敗は無視
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const totalImages = imageUrls.length + newImages.length + files.length;
    if (totalImages > 3) {
      setError('画像は最大3枚までです');
      return;
    }
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError('画像は1ファイル5MB以下にしてください');
        return;
      }
    }
    setNewImages((prev) => [...prev, ...Array.from(files)]);
    setError('');
  };

  const removeExistingImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError('');
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];
      const targetDartId = dartId || doc(collection(db, 'darts')).id;

      for (const file of newImages) {
        const storageRef = ref(storage, `images/darts/${targetDartId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const allImageUrls = [...imageUrls, ...uploadedUrls];

      // チップデータ構築
      const tipData = tipIsCustom
        ? {
            name: tipCustomName,
            type: tipCustomType,
            lengthMm: Number(tipCustomLength) || null,
            weightG: Number(tipCustomWeight) || null,
          }
        : selectedTip
          ? {
              name: selectedTip.name,
              type: selectedTip.type,
              lengthMm: selectedTip.lengthMm,
              weightG: selectedTip.weightG,
            }
          : { name: '', type: 'soft' as const, lengthMm: null, weightG: null };

      // シャフト・フライトデータ構築
      let shaftData;
      let flightData;

      if (useCondorAxe && selectedCondorAxe) {
        shaftData = {
          name: `${selectedCondorAxe.name} ${selectedCondorAxe.shaftLengthLabel}`,
          lengthMm: selectedCondorAxe.shaftLengthMm,
          weightG: null, // 一体型のためフライト側に重量含む
        };
        flightData = {
          name: `${selectedCondorAxe.name} ${selectedCondorAxe.shaftLengthLabel}`,
          shape: selectedCondorAxe.shape,
          weightG: selectedCondorAxe.totalWeightG,
          isCondorAxe: true,
          condorAxeShaftLengthMm: selectedCondorAxe.shaftLengthMm,
        };
      } else {
        shaftData = shaftIsCustom
          ? {
              name: shaftCustomName,
              lengthMm: Number(shaftCustomLength) || null,
              weightG: Number(shaftCustomWeight) || null,
            }
          : selectedShaft
            ? {
                name: selectedShaft.name,
                lengthMm: selectedShaft.lengthMm,
                weightG: selectedShaft.weightG,
              }
            : { name: '', lengthMm: null, weightG: null };

        flightData = flightIsCustom
          ? {
              name: flightCustomName,
              shape: flightCustomShape,
              weightG: Number(flightCustomWeight) || null,
              isCondorAxe: false,
            }
          : selectedFlight
            ? {
                name: selectedFlight.name,
                shape: selectedFlight.shape,
                weightG: selectedFlight.weightG,
                isCondorAxe: false,
              }
            : { name: '', shape: 'standard', weightG: null, isCondorAxe: false };
      }

      const dartData = {
        title,
        barrel: {
          name: barrelName,
          brand: barrelBrand,
          weight: Number(barrelWeight) || 0,
          maxDiameter: barrelMaxDiameter ? Number(barrelMaxDiameter) : null,
          length: barrelLength ? Number(barrelLength) : null,
          cut: barrelCut.join(','),
        },
        tip: tipData,
        shaft: shaftData,
        flight: flightData,
        description,
        imageUrls: allImageUrls,
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, 'darts', dartId), dartData);
      } else {
        await setDoc(doc(db, 'darts', targetDartId), {
          ...dartData,
          userId: session.user.id,
          userName: session.user.name || '',
          likeCount: 0,
          ...(isDraft && { isDraft: true }),
          ...(initialData?.sourceBarrelId && { sourceBarrelId: initialData.sourceBarrelId }),
          createdAt: serverTimestamp(),
        });
      }

      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('保存に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // CONDOR AXEの選択肢をグループ化
  const condorAxeGrouped = useMemo(() => {
    const shapes = [...new Set(CONDOR_AXE.map((c) => c.shape))];
    return shapes.map((shape) => ({
      shape,
      label: shape === 'standard' ? 'スタンダード' : shape === 'small' ? 'スモール' : 'スリム',
      items: CONDOR_AXE.filter((c) => c.shape === shape),
    }));
  }, []);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: { xs: 2, sm: 3 } }}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEdit
          ? 'セッティング編集'
          : isDraft
            ? 'ドラフトセッティング登録'
            : '新規セッティング登録'}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
      />

      {/* セッティング込みスペック表示（プリセット選択時のみ） */}
      {(() => {
        const hasTipSpecs = tipIsCustom ? false : !!selectedTip;
        const hasPartsSpecs = useCondorAxe
          ? !!selectedCondorAxe
          : (shaftIsCustom ? false : !!selectedShaft) &&
            (flightIsCustom ? false : !!selectedFlight);
        if (!hasTipSpecs || !hasPartsSpecs) return null;
        if (!totals.totalLength && !totals.totalWeight) return null;
        return (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              セッティング込み
            </Typography>
            <Typography variant="h5" color="primary">
              {[
                totals.totalLength && `${totals.totalLength.toFixed(1)}mm`,
                totals.totalWeight && `${totals.totalWeight.toFixed(1)}g`,
              ]
                .filter(Boolean)
                .join(' / ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (
              {[
                totals.totalLength &&
                  `${tipCustomType === 'steel' ? 'ポイント' : 'チップ'}${totals.tipLen} + バレル${Number(barrelLength) || 0} + シャフト${totals.shaftLen}mm`,
                totals.totalWeight &&
                  (tipCustomType === 'steel'
                    ? `バレル（ポイント込み）${Number(barrelWeight) || 0} + シャフト${totals.shaftW} + フライト${totals.flightW}g`
                    : `チップ${totals.tipW} + バレル${Number(barrelWeight) || 0} + シャフト${totals.shaftW} + フライト${totals.flightW}g`),
              ]
                .filter(Boolean)
                .join(' | ')}
              )
            </Typography>
          </Paper>
        );
      })()}

      {/* バレル */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">バレル</Typography>
        <Button size="small" startIcon={<SearchIcon />} onClick={() => setSearchOpen(true)}>
          バレル名で検索
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          label="名前"
          value={barrelName}
          onChange={(e) => setBarrelName(e.target.value)}
          required
          sx={{ flex: '1 1 200px' }}
        />
        <TextField
          label="ブランド"
          value={barrelBrand}
          onChange={(e) => setBarrelBrand(e.target.value)}
          required
          sx={{ flex: '1 1 200px' }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="重量(g)"
          type="number"
          value={barrelWeight}
          onChange={(e) => setBarrelWeight(e.target.value)}
          required
          sx={{ flex: '1 1 100px' }}
          inputProps={{ step: '0.1' }}
        />
        <TextField
          label="最大径(mm)"
          type="number"
          value={barrelMaxDiameter}
          onChange={(e) => setBarrelMaxDiameter(e.target.value)}
          sx={{ flex: '1 1 100px' }}
          inputProps={{ step: '0.1' }}
        />
        <TextField
          label="全長(mm)"
          type="number"
          value={barrelLength}
          onChange={(e) => setBarrelLength(e.target.value)}
          sx={{ flex: '1 1 100px' }}
          inputProps={{ step: '0.1' }}
        />
        <Autocomplete
          multiple
          options={BARREL_CUTS}
          value={barrelCut}
          onChange={(_, v) => setBarrelCut(v)}
          filterSelectedOptions
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="カット" placeholder="リングカット等" />
          )}
          sx={{ flex: '1 1 150px' }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* チップ / ポイント */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">{tipCustomType === 'steel' ? 'ポイント' : 'チップ'}</Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={tipIsCustom}
              onChange={(e) => setTipIsCustom(e.target.checked)}
            />
          }
          label={<Typography variant="caption">手動入力</Typography>}
        />
      </Box>
      <TextField
        label="タイプ"
        select
        value={tipCustomType}
        onChange={(e) => {
          setTipCustomType(e.target.value as 'soft' | 'steel');
          setSelectedTip(null);
        }}
        sx={{ mb: 2, width: 150 }}
        size="small"
      >
        <MenuItem value="soft">ソフト</MenuItem>
        <MenuItem value="steel">スティール</MenuItem>
      </TextField>
      {tipIsCustom ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            label={tipCustomType === 'steel' ? 'ポイント名' : 'チップ名'}
            value={tipCustomName}
            onChange={(e) => setTipCustomName(e.target.value)}
            required
            sx={{ flex: '1 1 200px' }}
          />
          <TextField
            label="長さ(mm)"
            type="number"
            value={tipCustomLength}
            onChange={(e) => setTipCustomLength(e.target.value)}
            sx={{ flex: '0 0 110px' }}
            inputProps={{ step: '0.1' }}
          />
          <TextField
            label="重さ(g)"
            type="number"
            value={tipCustomWeight}
            onChange={(e) => setTipCustomWeight(e.target.value)}
            sx={{ flex: '0 0 110px' }}
            inputProps={{ step: '0.01' }}
          />
        </Box>
      ) : (
        <Autocomplete
          options={TIPS.filter((t) => t.type === tipCustomType)}
          value={selectedTip}
          onChange={(_, v) => setSelectedTip(v)}
          getOptionLabel={(o) => o.name}
          renderOption={(props, option) => (
            <li {...props} key={option.name}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.lengthMm}mm / {option.weightG}g
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={tipCustomType === 'steel' ? 'ポイントを選択' : 'チップを選択'}
              required={!tipIsCustom}
            />
          )}
          sx={{ mb: 3 }}
        />
      )}

      <Divider sx={{ mb: 3 }} />

      {/* CONDOR AXE切り替え */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">シャフト & フライト</Typography>
        <Chip
          label="CONDOR AXE"
          color={useCondorAxe ? 'primary' : 'default'}
          variant={useCondorAxe ? 'filled' : 'outlined'}
          onClick={() => {
            setUseCondorAxe(!useCondorAxe);
            if (!useCondorAxe) {
              setSelectedShaft(null);
              setSelectedFlight(null);
            } else {
              setSelectedCondorAxe(null);
            }
          }}
          size="small"
        />
      </Box>

      {useCondorAxe ? (
        // CONDOR AXE一体型選択
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            シャフト+フライト一体型。形状とシャフト長を選択してください。
          </Typography>
          {condorAxeGrouped.map((group) => (
            <Box key={group.shape} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {group.label}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {group.items.map((item) => (
                  <Chip
                    key={`${item.shape}-${item.shaftLengthMm}`}
                    label={`${item.shaftLengthLabel} (${item.totalWeightG}g)`}
                    color={selectedCondorAxe === item ? 'primary' : 'default'}
                    variant={selectedCondorAxe === item ? 'filled' : 'outlined'}
                    onClick={() => setSelectedCondorAxe(item)}
                  />
                ))}
              </Box>
            </Box>
          ))}
          {selectedCondorAxe && (
            <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
              <Typography variant="body2">
                {selectedCondorAxe.name} {selectedCondorAxe.shaftLengthLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                シャフト長: {selectedCondorAxe.shaftLengthMm}mm / 重さ:{' '}
                {selectedCondorAxe.totalWeightG}g（一体型）
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <>
          {/* シャフト */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography variant="subtitle1">シャフト</Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={shaftIsCustom}
                  onChange={(e) => setShaftIsCustom(e.target.checked)}
                />
              }
              label={<Typography variant="caption">手動入力</Typography>}
            />
          </Box>
          {shaftIsCustom ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <TextField
                label="名前"
                value={shaftCustomName}
                onChange={(e) => setShaftCustomName(e.target.value)}
                required
                sx={{ flex: '1 1 200px' }}
              />
              <TextField
                label="長さ(mm)"
                type="number"
                value={shaftCustomLength}
                onChange={(e) => setShaftCustomLength(e.target.value)}
                sx={{ flex: '0 0 110px' }}
                inputProps={{ step: '0.1' }}
              />
              <TextField
                label="重さ(g)"
                type="number"
                value={shaftCustomWeight}
                onChange={(e) => setShaftCustomWeight(e.target.value)}
                sx={{ flex: '0 0 110px' }}
                inputProps={{ step: '0.01' }}
              />
            </Box>
          ) : (
            <Autocomplete
              options={SHAFTS}
              value={selectedShaft}
              onChange={(_, v) => setSelectedShaft(v)}
              getOptionLabel={(o) => o.name}
              groupBy={(o) => o.brand}
              renderOption={(props, option) => (
                <li {...props} key={option.name}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.lengthMm}mm / {option.weightG}g
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="シャフトを選択" required={!shaftIsCustom} />
              )}
              sx={{ mb: 3 }}
            />
          )}

          {/* 互換性警告 */}
          {(() => {
            const warning = checkShaftFlightCompatibility(
              shaftIsCustom ? null : selectedShaft,
              flightIsCustom ? null : selectedFlight,
            );
            return warning ? (
              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
                {warning}
              </Alert>
            ) : null;
          })()}

          {/* フライト */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography variant="subtitle1">フライト</Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={flightIsCustom}
                  onChange={(e) => setFlightIsCustom(e.target.checked)}
                />
              }
              label={<Typography variant="caption">手動入力</Typography>}
            />
          </Box>
          {flightIsCustom ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <TextField
                label="名前"
                value={flightCustomName}
                onChange={(e) => setFlightCustomName(e.target.value)}
                required
                sx={{ flex: '1 1 200px' }}
              />
              <TextField
                label="形状"
                select
                value={flightCustomShape}
                onChange={(e) => setFlightCustomShape(e.target.value)}
                sx={{ flex: '0 0 160px' }}
              >
                <MenuItem value="standard">スタンダード</MenuItem>
                <MenuItem value="slim">スリム</MenuItem>
                <MenuItem value="kite">シェイプ</MenuItem>
                <MenuItem value="teardrop">ティアドロップ</MenuItem>
                <MenuItem value="small">スモール</MenuItem>
              </TextField>
              <TextField
                label="重さ(g)"
                type="number"
                value={flightCustomWeight}
                onChange={(e) => setFlightCustomWeight(e.target.value)}
                sx={{ flex: '0 0 110px' }}
                inputProps={{ step: '0.01' }}
              />
            </Box>
          ) : (
            <Autocomplete
              options={FLIGHTS}
              value={selectedFlight}
              onChange={(_, v) => setSelectedFlight(v)}
              getOptionLabel={(o) => o.name}
              groupBy={(o) => o.brand}
              renderOption={(props, option) => (
                <li {...props} key={option.name}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.shape === 'standard'
                        ? 'スタンダード'
                        : option.shape === 'slim'
                          ? 'スリム'
                          : option.shape === 'kite'
                            ? 'シェイプ'
                            : option.shape === 'teardrop'
                              ? 'ティアドロップ'
                              : 'スモール'}{' '}
                      / {option.weightG}g
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="フライトを選択" required={!flightIsCustom} />
              )}
              sx={{ mb: 3 }}
            />
          )}
        </>
      )}

      <Divider sx={{ mb: 3 }} />

      <TextField
        label="説明・メモ"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 3 }}
      />

      <Typography variant="h6" sx={{ mb: 1 }}>
        画像（最大3枚）
      </Typography>
      {imageUrls.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {imageUrls.map((url, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              <img
                src={url}
                alt="セッティング画像プレビュー"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
              />
              <IconButton
                size="small"
                onClick={() => removeExistingImage(i)}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                aria-label="画像を削除"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      {newImages.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {newImages.map((file, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(file)}
                alt="新規画像プレビュー"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
              />
              <IconButton
                size="small"
                onClick={() => removeNewImage(i)}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                aria-label="画像を削除"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        sx={{ mb: 3 }}
        disabled={imageUrls.length + newImages.length >= 3}
      >
        画像を選択
        <input type="file" hidden accept="image/*" multiple onChange={handleImageSelect} />
      </Button>

      <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
        {loading ? '保存中...' : isEdit ? '更新' : '登録'}
      </Button>

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>バレル検索</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="バレル名を入力..."
              size="small"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarrelSearch();
                }
              }}
            />
            <Button variant="contained" onClick={handleBarrelSearch} disabled={searching}>
              {searching ? <CircularProgress size={20} /> : '検索'}
            </Button>
          </Box>
          {searchResults.length > 0 ? (
            <List>
              {searchResults.map((result, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemButton onClick={() => handleSelectBarrel(result)}>
                    <ListItemAvatar>
                      <Avatar
                        src={result.imageUrl || undefined}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                      >
                        {result.name?.charAt(0) || '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={result.name}
                      secondary={[
                        result.brand && `${result.brand}`,
                        result.weight && `${result.weight}g`,
                        result.maxDiameter && `最大径${result.maxDiameter}mm`,
                        result.length && `全長${result.length}mm`,
                        result.cut && `${result.cut}`,
                      ]
                        .filter(Boolean)
                        .join(' / ')}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : searching ? null : (
            searchQuery && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                検索結果がありません
              </Typography>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
