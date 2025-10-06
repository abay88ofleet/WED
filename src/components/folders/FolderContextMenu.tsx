import { FolderPlus, Pencil, Trash2, Pin, Info, Upload } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Category } from '../../types';

interface FolderContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  category: Category | null;
  onClose: () => void;
  onNewFolder: (parentId: string) => void;
  onUploadFiles: (categoryId: string) => void;
  onRename: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onTogglePin: (categoryId: string, isPinned: boolean) => void;
  onProperties: (categoryId: string) => void;
}

export function FolderContextMenu({
  isOpen,
  position,
  category,
  onClose,
  onNewFolder,
  onUploadFiles,
  onRename,
  onDelete,
  onTogglePin,
  onProperties,
}: FolderContextMenuProps) {
  if (!category) return null;

  const isPinned = category.isPinned || false;

  const menuItems: ContextMenuItem[] = [
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: FolderPlus,
      onClick: () => onNewFolder(category.id),
    },
    {
      id: 'upload-files',
      label: 'Upload Files',
      icon: Upload,
      onClick: () => onUploadFiles(category.id),
      separator: true,
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: Pencil,
      onClick: () => onRename(category.id),
      shortcut: 'F2',
    },
    {
      id: 'pin',
      label: isPinned ? 'Unpin' : 'Pin',
      icon: Pin,
      onClick: () => onTogglePin(category.id, !isPinned),
      shortcut: 'Ctrl+P',
      separator: true,
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Info,
      onClick: () => onProperties(category.id),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: () => onDelete(category.id),
      destructive: true,
      separator: true,
      shortcut: 'Del',
    },
  ];

  return (
    <ContextMenu
      isOpen={isOpen}
      position={position}
      items={menuItems}
      onClose={onClose}
    />
  );
}
