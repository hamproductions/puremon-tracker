import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckDouble,
  FaForward,
  FaImage,
  FaMagnifyingGlassPlus,
  FaWandMagicSparkles,
  FaXmark
} from 'react-icons/fa6';
import { Box, Center, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Heading } from '~/components/ui/heading';
import { IconButton } from '~/components/ui/icon-button';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Spinner } from '~/components/ui/spinner';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import { useAuth } from '~/hooks/useAuth';
import { catalogActions } from '~/hooks/useCatalog';
import { uploadBromideImage } from '~/lib/storage';
import { createImageSubmission, saveImageSubmission } from '~/lib/submissions';
import type { Bromide, Catalog, Collection } from '~/types';
import { bromideLabel, bromidesByCollection, memberColor } from '~/utils/stats';
import { CROP_MODES, cropModeAspect, cropModeForAspect, type CropMode } from './cropModes';
import { getCroppedBlob } from './cropImage';
import { bromideAspectRatio } from '~/utils/aspect';
import { scanDocument } from './documentScanner';
import { uploadTargetsForMode } from './uploadTargets';

const Img = styled('img');

interface PhotoAddDialogProps {
  catalog: Catalog;
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTargetId?: string | null;
  adminEdit?: boolean;
}

interface PickedImage {
  id: string;
  src: string;
}

type Phase = 'setup' | 'cropping' | 'summary';

export function PhotoAddDialog({
  catalog,
  collection,
  open,
  onOpenChange,
  initialTargetId = null,
  adminEdit = false
}: PhotoAddDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} lazyMount unmountOnExit>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          display="flex"
          flexDirection="column"
          w="full"
          maxW={{ base: '96vw', md: '720px' }}
          maxH={{ base: '92dvh', md: '90vh' }}
          bgColor="board.panelSolid"
          overflow="hidden"
        >
          <PhotoAddBody
            catalog={catalog}
            collection={collection}
            onOpenChange={onOpenChange}
            initialTargetId={initialTargetId}
            adminEdit={adminEdit}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function PhotoAddBody({
  catalog,
  collection,
  onOpenChange,
  initialTargetId,
  adminEdit
}: {
  catalog: Catalog;
  collection: Collection;
  onOpenChange: (open: boolean) => void;
  initialTargetId: string | null;
  adminEdit: boolean;
}) {
  const { toast } = useToaster();
  const { profile } = useAuth();
  const hasSizes = (collection.sizes?.length ?? 0) > 0;
  const [size, setSize] = useState<string | null>(
    hasSizes ? (collection.sizes?.[0] ?? null) : null
  );

  const targets = useMemo(
    () => bromidesByCollection(catalog, collection.id, hasSizes ? size : undefined),
    [catalog, collection.id, hasSizes, size]
  );
  const uploadTargets = useMemo(
    () => uploadTargetsForMode(targets, { adminEdit }),
    [adminEdit, targets]
  );

  const [queue, setQueue] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTouched(false);
  }, [size]);

  useEffect(() => {
    if (touched) return;
    if (initialTargetId && uploadTargets.some((b) => b.id === initialTargetId)) {
      setQueue([initialTargetId]);
      return;
    }
    setQueue(uploadTargets.map((b) => b.id));
  }, [initialTargetId, touched, uploadTargets]);

  const targetById = useMemo(() => new Map(targets.map((b) => [b.id, b])), [targets]);
  const queueBromides = useMemo(
    () => queue.map((id) => targetById.get(id)).filter((b): b is Bromide => Boolean(b)),
    [queue, targetById]
  );

  const [phase, setPhase] = useState<Phase>('setup');
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [cropMode, setCropMode] = useState<CropMode>('portrait');

  const selectQueue = (ids: string[]) => {
    setTouched(true);
    setQueue(ids);
  };

  const resetAndClose = () => {
    picked.forEach(revokePickedImage);
    onOpenChange(false);
  };

  const onFilesPicked = (files: FileList | File[], targetIds?: string[]) => {
    const list = Array.from(files).filter(isImageFile);
    if (list.length === 0) return;
    const nextQueue = targetIds ?? queue;
    const firstPickedTarget = nextQueue[0] ? targetById.get(nextQueue[0]) : undefined;
    if (targetIds) {
      setTouched(true);
      setQueue(targetIds);
    }
    void Promise.all(list.map((f) => fileToDataUrl(f))).then((srcs) => {
      const next = srcs.map((src) => ({ id: crypto.randomUUID(), src }));
      setPicked(next);
      setCropIndex(0);
      setSavedCount(0);
      setCropMode(cropModeForAspect(firstPickedTarget?.aspect));
      setPhase('cropping');
    });
  };

  const finishBatch = (saved: number) => {
    picked.forEach(revokePickedImage);
    setPicked([]);
    setSavedCount(saved);
    setPhase('summary');
    if (saved > 0)
      toast({ title: `${saved}枚を${adminEdit ? '登録' : '投稿'}しました`, type: 'success' });
  };

  return (
    <>
      <HStack gap="3" justifyContent="space-between" alignItems="flex-start" p="4" pb="3">
        <Stack gap="0.5" minW="0">
          <Dialog.Title asChild>
            <Heading fontSize="lg" truncate>
              写真を追加 — {collection.title}
            </Heading>
          </Dialog.Title>
          {phase === 'cropping' ? (
            <Text color="fg.muted" fontSize="xs">
              {cropIndex + 1} / {picked.length} 枚目
            </Text>
          ) : (
            <Text color="fg.muted" fontSize="xs">
              写真を選んで、登録先と切り抜きを確認します
            </Text>
          )}
        </Stack>
        <Dialog.CloseTrigger asChild>
          <IconButton size="sm" variant="ghost" aria-label="閉じる" onClick={resetAndClose}>
            <FaXmark />
          </IconButton>
        </Dialog.CloseTrigger>
      </HStack>

      {phase === 'setup' && (
        <SetupStep
          catalog={catalog}
          collection={collection}
          hasSizes={hasSizes}
          size={size}
          setSize={setSize}
          targets={targets}
          uploadTargets={uploadTargets}
          queue={queue}
          setQueue={selectQueue}
          queueBromides={queueBromides}
          onFilesPicked={onFilesPicked}
          adminEdit={adminEdit}
        />
      )}

      {phase === 'cropping' && (
        <CropStep
          catalog={catalog}
          picked={picked}
          cropIndex={cropIndex}
          setCropIndex={setCropIndex}
          queueBromides={queueBromides}
          savedCount={savedCount}
          setSavedCount={setSavedCount}
          cropMode={cropMode}
          setCropMode={setCropMode}
          onFinish={finishBatch}
          profile={profile}
          adminEdit={adminEdit}
        />
      )}

      {phase === 'summary' && (
        <SummaryStep
          catalog={catalog}
          savedCount={savedCount}
          remaining={queueBromides}
          adminEdit={adminEdit}
          onAddMore={() => setPhase('setup')}
          onClose={resetAndClose}
        />
      )}
    </>
  );
}

function SetupStep({
  catalog,
  collection,
  hasSizes,
  size,
  setSize,
  targets,
  uploadTargets,
  queue,
  setQueue,
  queueBromides,
  onFilesPicked,
  adminEdit
}: {
  catalog: Catalog;
  collection: Collection;
  hasSizes: boolean;
  size: string | null;
  setSize: (s: string | null) => void;
  targets: Bromide[];
  uploadTargets: Bromide[];
  queue: string[];
  setQueue: (ids: string[]) => void;
  queueBromides: Bromide[];
  onFilesPicked: (files: FileList | File[], targetIds?: string[]) => void;
  adminEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileInputMultiple, setFileInputMultiple] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const queueIndex = useMemo(() => new Map(queue.map((id, i) => [id, i])), [queue]);
  const targetIdsRef = useRef<string[] | undefined>(undefined);
  const bulkTargets = queueBromides.length > 0 ? queueBromides : uploadTargets;

  const openPicker = (targetIds: string[], multiple: boolean) => {
    if (targetIds.length === 0) return;
    targetIdsRef.current = targetIds;
    setFileInputMultiple(multiple);
    if (inputRef.current) inputRef.current.multiple = multiple;
    inputRef.current?.click();
  };

  return (
    <Stack flex="1" gap="4" px="4" pb="4" overflowY="auto">
      <styled.input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={fileInputMultiple}
        onChange={(e) => {
          if (e.target.files) onFilesPicked(e.target.files, targetIdsRef.current);
          targetIdsRef.current = undefined;
          e.target.value = '';
        }}
        display="none"
      />

      <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Text color="fg.muted" fontSize="xs">
          {queueBromides.length > 0
            ? `一括対象: ${queueBromides.length}枚`
            : adminEdit
              ? '差し替える枠をクリックしてください'
              : '画像募集中の枠をクリックしてください'}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            openPicker(
              bulkTargets.map((b) => b.id),
              true
            )
          }
          disabled={bulkTargets.length === 0}
          colorPalette="gray"
        >
          <FaImage />
          複数枚を一括
        </Button>
      </HStack>

      {hasSizes && (
        <Stack gap="1.5">
          <Text color="fg.muted" fontSize="xs" fontWeight="bold">
            サイズ
          </Text>
          <SegmentGroup.Root
            value={size ?? ''}
            onValueChange={(e) => setSize(e.value)}
            size="sm"
            orientation="horizontal"
          >
            <SegmentGroup.Indicator />
            {(collection.sizes ?? []).map((s) => (
              <SegmentGroup.Item key={s} value={s}>
                <SegmentGroup.ItemText>{s}</SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>
        </Stack>
      )}

      <Stack gap="2">
        <HStack justifyContent="space-between" alignItems="baseline">
          <Text color="fg.muted" fontSize="xs" fontWeight="bold">
            クリックして画像を選ぶ
          </Text>
          <Text color="accent.text" fontSize="xs" fontWeight="bold">
            {adminEdit ? '既存画像も差替可' : `画像募集中: ${uploadTargets.length}枚`}
          </Text>
        </HStack>

        {targets.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            このサイズには登録先がありません。
          </Text>
        ) : uploadTargets.length === 0 ? (
          <Box
            borderColor="board.ownedBorder"
            borderRadius="lg"
            borderWidth="1px"
            p="3"
            bgColor="board.owned"
          >
            <Text fontSize="sm" fontWeight="medium">
              このサイズの画像はすべて揃っています。
            </Text>
          </Box>
        ) : (
          <Grid gap="2" columns={{ base: 3, sm: 4, md: 5 }}>
            {uploadTargets.map((b) => {
              const order = queueIndex.get(b.id);
              const inQueue = order !== undefined;
              const color = memberColor(catalog, b.memberId);
              return (
                <Box
                  as="label"
                  key={b.id}
                  onDragOver={(e: React.DragEvent) => {
                    e.preventDefault();
                    setDragTarget(b.id);
                  }}
                  onDragLeave={() => setDragTarget((id) => (id === b.id ? null : id))}
                  onDrop={(e: React.DragEvent) => {
                    e.preventDefault();
                    setDragTarget(null);
                    if (e.dataTransfer.files?.length) onFilesPicked(e.dataTransfer.files, [b.id]);
                  }}
                  style={{ borderColor: dragTarget === b.id || inQueue ? color : 'transparent' }}
                  cursor="pointer"
                  position="relative"
                  borderRadius="lg"
                  borderWidth="1.5px"
                  p="1.5"
                  textAlign="left"
                  bgColor={dragTarget === b.id ? 'accent.subtle' : 'board.tile'}
                  opacity={1}
                  _hover={{ opacity: 1 }}
                >
                  <styled.input
                    type="file"
                    accept="image/*"
                    aria-label={`${bromideLabel(catalog, b)}の画像を選ぶ`}
                    onChange={(e) => {
                      if (e.target.files) onFilesPicked(e.target.files, [b.id]);
                      e.target.value = '';
                    }}
                    cursor="pointer"
                    zIndex="4"
                    inset="0"
                    position="absolute"
                    opacity="0"
                  />
                  <Box
                    style={{ aspectRatio: bromideAspectRatio(b) }}
                    position="relative"
                    borderRadius="md"
                    bgColor="board.canvas"
                    overflow="hidden"
                  >
                    {b.imageUrl ? (
                      <Img
                        src={b.imageUrl}
                        alt=""
                        inset="0"
                        position="absolute"
                        objectFit="cover"
                        w="full"
                        h="full"
                      />
                    ) : (
                      <Center
                        style={{
                          background: `linear-gradient(150deg, ${color}24 0%, transparent 100%)`
                        }}
                        inset="0"
                        position="absolute"
                      >
                        <Text textStyle="display" style={{ color }} fontSize="lg" lineHeight="1">
                          {b.no}
                        </Text>
                      </Center>
                    )}
                    {inQueue && (
                      <Center
                        style={{ backgroundColor: color }}
                        position="absolute"
                        top="1"
                        left="1"
                        borderRadius="full"
                        w="4.5"
                        h="4.5"
                        color="white"
                        fontSize="2xs"
                        fontWeight="bold"
                      >
                        {order + 1}
                      </Center>
                    )}
                    <Center
                      style={{ backgroundColor: 'rgba(0,0,0,0.54)' }}
                      position="absolute"
                      right="1"
                      bottom="1"
                      borderRadius="md"
                      w="7"
                      h="7"
                      color="white"
                    >
                      <FaImage size={12} />
                    </Center>
                  </Box>
                  <HStack gap="1" alignItems="center" minW="0" mt="1">
                    <Box
                      style={{ backgroundColor: color }}
                      flexShrink="0"
                      borderRadius="full"
                      w="1.5"
                      h="1.5"
                    />
                    <Text fontSize="2xs" fontWeight="medium" truncate>
                      {bromideLabel(catalog, b)}
                    </Text>
                  </HStack>
                  <Text
                    color={b.imageUrl ? 'fg.subtle' : 'brand.pink'}
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    {b.imageUrl ? '画像あり' : '画像募集中'}
                  </Text>
                </Box>
              );
            })}
          </Grid>
        )}
      </Stack>

      {uploadTargets.length > 0 && (
        <HStack gap="2" justifyContent="space-between" flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const missingIds = uploadTargets.filter((b) => !b.imageUrl).map((b) => b.id);
              setQueue(missingIds);
            }}
            disabled={uploadTargets.every((b) => b.imageUrl)}
          >
            未登録だけを一括対象
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const ids = uploadTargets.map((b) => b.id);
              setQueue(ids);
            }}
          >
            全枠を一括対象
          </Button>
        </HStack>
      )}
    </Stack>
  );
}

function CropStep({
  catalog,
  picked,
  cropIndex,
  setCropIndex,
  queueBromides,
  savedCount,
  setSavedCount,
  cropMode,
  setCropMode,
  onFinish,
  profile,
  adminEdit
}: {
  catalog: Catalog;
  picked: PickedImage[];
  cropIndex: number;
  setCropIndex: (i: number) => void;
  queueBromides: Bromide[];
  savedCount: number;
  setSavedCount: (n: number) => void;
  cropMode: CropMode;
  setCropMode: (mode: CropMode) => void;
  onFinish: (saved: number) => void;
  profile: ReturnType<typeof useAuth>['profile'];
  adminEdit: boolean;
}) {
  const { toast } = useToaster();
  const current = picked[cropIndex];
  const target = queueBromides[savedCount];

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedSrc, setScannedSrc] = useState<string | null>(null);
  const scanTokenRef = useRef<{ cancelled: boolean } | null>(null);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    setCropMode(cropModeForAspect(target?.aspect));
    if (scanTokenRef.current) scanTokenRef.current.cancelled = true;
    setScanning(false);
    setScannedSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [cropIndex, setCropMode, target?.aspect]);

  useEffect(() => {
    return () => {
      if (scanTokenRef.current) scanTokenRef.current.cancelled = true;
      setScannedSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const cancelScan = () => {
    if (scanTokenRef.current) scanTokenRef.current.cancelled = true;
    scanTokenRef.current = null;
    setScanning(false);
  };

  const runScan = async () => {
    if (!current || scanning) return;
    const token = { cancelled: false };
    scanTokenRef.current = token;
    setScanning(true);
    let blob: Blob | null = null;
    try {
      blob = await scanDocument(current.src, token);
    } catch {
      blob = null;
    }
    if (token.cancelled || scanTokenRef.current !== token) return;
    scanTokenRef.current = null;
    setScanning(false);
    if (!blob) {
      toast({ title: '自動検出できませんでした。手動で調整してください', type: 'error' });
      return;
    }
    const url = URL.createObjectURL(blob);
    setScannedSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    toast({ title: '書類を検出してトリミングしました', type: 'success' });
  };

  if (!current) {
    onFinish(savedCount);
    return null;
  }

  const isLastImage = cropIndex >= picked.length - 1;
  const outOfTargets = !target;

  const advance = (saved: number) => {
    if (isLastImage) {
      onFinish(saved);
      return;
    }
    setCropIndex(cropIndex + 1);
  };

  const activeSrc = scannedSrc ?? current.src;
  const aspect = cropModeAspect(cropMode);

  const confirm = async () => {
    if (!areaPixels || !target) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(activeSrc, areaPixels);
      const file = new File([blob], `${target.id}.jpg`, { type: 'image/jpeg' });
      const { url } = await uploadBromideImage(file, target.id);
      if (adminEdit) {
        const saved = await catalogActions.setBromideImage(target.id, url);
        if (!saved) throw new Error('image registration failed');
      } else {
        await saveImageSubmission(
          createImageSubmission({ bromideId: target.id, imageUrl: url, profile })
        );
      }
      const saved = savedCount + 1;
      setSavedCount(saved);
      advance(saved);
    } catch {
      toast({ title: '登録に失敗しました', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const color = target ? memberColor(catalog, target.memberId) : '#FF5FA2';

  return (
    <Stack flex="1" gap="0" minH="0">
      <Box position="relative" flex="1" minH={{ base: '52dvh', md: '380px' }} bgColor="#10141c">
        <Cropper
          image={activeSrc}
          crop={crop}
          aspect={aspect}
          minZoom={1}
          maxZoom={5}
          restrictPosition={false}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          zoom={zoom}
        />
        <Button
          size="sm"
          variant="solid"
          onClick={runScan}
          disabled={scanning || busy}
          colorPalette="accent"
          zIndex="1"
          position="absolute"
          top="3"
          right="3"
        >
          <FaWandMagicSparkles />
          書類トリム
        </Button>
        {scanning && (
          <Center
            style={{ backgroundColor: 'rgba(8, 11, 18, 0.82)' }}
            zIndex="2"
            inset="0"
            position="absolute"
            gap="3"
            flexDirection="column"
            px="6"
            textAlign="center"
          >
            <Spinner size="lg" />
            <Text maxW="260px" color="fg.muted" fontSize="xs">
              写真の外枠を検出中…（初回は読み込みに時間がかかります）
            </Text>
            <Button size="sm" variant="outline" onClick={cancelScan} colorPalette="gray">
              <FaXmark />
              キャンセル
            </Button>
          </Center>
        )}
      </Box>

      <Stack gap="3" p="4" bgColor="board.panelSolid">
        <HStack gap="3" justifyContent="space-between" alignItems="center">
          {target ? (
            <HStack gap="2" minW="0">
              <Box
                style={{ backgroundColor: color }}
                flexShrink="0"
                borderRadius="full"
                w="3"
                h="3"
              />
              <Stack gap="0">
                <Text fontSize="sm" fontWeight="bold" truncate>
                  {bromideLabel(catalog, target)}
                </Text>
                <Text color="fg.muted" fontSize="2xs">
                  登録先 {savedCount + 1} / {queueBromides.length}
                </Text>
              </Stack>
            </HStack>
          ) : (
            <Text color="brand.pink" fontSize="sm" fontWeight="bold">
              登録先がすべて埋まりました
            </Text>
          )}
          <Badge size="sm" variant="subtle">
            {cropIndex + 1} / {picked.length}
          </Badge>
        </HStack>

        <SegmentGroup.Root
          value={cropMode}
          onValueChange={(e) => setCropMode(e.value as CropMode)}
          size="sm"
        >
          <SegmentGroup.Indicator />
          {CROP_MODES.map((item) => (
            <SegmentGroup.Item key={item.value} value={item.value}>
              <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
              <SegmentGroup.ItemControl />
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>

        <HStack gap="2.5" alignItems="center">
          <FaMagnifyingGlassPlus size={14} color="var(--colors-fg-muted)" />
          <styled.input
            type="range"
            min={1}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="ズーム"
            cursor="pointer"
            flex="1"
            accentColor="accent.default"
          />
        </HStack>

        <HStack gap="2" justifyContent="space-between" flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCropIndex(Math.max(0, cropIndex - 1))}
            disabled={cropIndex === 0 || busy}
          >
            <FaArrowLeft />
            戻る
          </Button>
          <HStack gap="2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => advance(savedCount)}
              disabled={busy}
              colorPalette="gray"
            >
              <FaForward />
              スキップ
            </Button>
            <Button
              size="sm"
              onClick={confirm}
              loading={busy}
              disabled={!areaPixels || outOfTargets}
            >
              {isLastImage ? '使う / 完了' : '使う / 次へ'}
              {!isLastImage && <FaArrowRight />}
            </Button>
          </HStack>
        </HStack>
      </Stack>
    </Stack>
  );
}

function SummaryStep({
  catalog,
  savedCount,
  remaining,
  adminEdit,
  onAddMore,
  onClose
}: {
  catalog: Catalog;
  savedCount: number;
  remaining: Bromide[];
  adminEdit: boolean;
  onAddMore: () => void;
  onClose: () => void;
}) {
  const left = remaining.slice(savedCount);
  return (
    <Stack flex="1" gap="4" p="4" pt="2" overflowY="auto">
      <Center
        gap="2"
        flexDir="column"
        borderColor="board.ownedBorder"
        borderRadius="xl"
        borderWidth="1px"
        py="6"
        px="4"
        textAlign="center"
        bgColor="board.owned"
      >
        <FaCheckDouble size={26} color="var(--colors-accent-text)" />
        <Heading fontSize="xl">
          {savedCount}枚を{adminEdit ? '登録' : '投稿'}しました
        </Heading>
        {left.length > 0 ? (
          <Text color="fg.muted" fontSize="sm">
            残り {left.length}枚 の登録先が未登録のままです。
          </Text>
        ) : (
          <Text color="fg.muted" fontSize="sm">
            選んだ登録先はすべて登録済みです。
          </Text>
        )}
      </Center>

      {left.length > 0 && (
        <Stack gap="1.5">
          <Text color="fg.muted" fontSize="xs" fontWeight="bold">
            未登録の登録先
          </Text>
          <HStack gap="1.5" flexWrap="wrap">
            {left.map((b) => (
              <Badge key={b.id} size="sm" variant="outline">
                {bromideLabel(catalog, b)}
              </Badge>
            ))}
          </HStack>
        </Stack>
      )}

      <HStack gap="2" justifyContent="flex-end">
        <Button variant="outline" onClick={onAddMore}>
          続けて追加
        </Button>
        <Button onClick={onClose}>完了</Button>
      </HStack>
    </Stack>
  );
}

function revokePickedImage(image: PickedImage) {
  if (image.src.startsWith('blob:')) URL.revokeObjectURL(image.src);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('image read failed'));
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(file.name);
}
