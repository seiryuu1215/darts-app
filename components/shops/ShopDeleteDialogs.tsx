'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import type { ShopBookmark, ShopList } from '@/types';

interface ShopDeleteDialogsProps {
  deleteConfirmBookmark: ShopBookmark | null;
  onCloseBookmarkDelete: () => void;
  onConfirmBookmarkDelete: () => void;
  deleteConfirmList: ShopList | null;
  onCloseListDelete: () => void;
  onConfirmListDelete: () => void;
}

export default function ShopDeleteDialogs({
  deleteConfirmBookmark,
  onCloseBookmarkDelete,
  onConfirmBookmarkDelete,
  deleteConfirmList,
  onCloseListDelete,
  onConfirmListDelete,
}: ShopDeleteDialogsProps) {
  return (
    <>
      <Dialog open={Boolean(deleteConfirmBookmark)} onClose={onCloseBookmarkDelete}>
        <DialogTitle>ショップを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{deleteConfirmBookmark?.name}」を削除しますか？この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBookmarkDelete}>キャンセル</Button>
          <Button onClick={onConfirmBookmarkDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirmList)} onClose={onCloseListDelete}>
        <DialogTitle>リストを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{deleteConfirmList?.name}
            」を削除しますか？リスト内のショップは削除されませんが、リストへの紐付けは解除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseListDelete}>キャンセル</Button>
          <Button onClick={onConfirmListDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
