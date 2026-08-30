import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../api/files';

export function useFiles(serverId, path) {
  return useQuery({
    queryKey: ['files', serverId, path],
    queryFn: () => filesApi.list(serverId, path),
    enabled: Boolean(serverId && path),
  });
}

export function useFileInfo(serverId, path, enabled) {
  return useQuery({
    queryKey: ['file-info', serverId, path],
    queryFn: () => filesApi.info(serverId, path),
    enabled: Boolean(serverId && path && enabled),
  });
}

export function useFileMutations(serverId, path) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['files', serverId] });

  const mkdir = useMutation({
    mutationFn: (fullPath) => filesApi.mkdir(serverId, fullPath),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: ({ targetPath, newName }) => filesApi.rename(serverId, targetPath, newName),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (targetPath) => filesApi.remove(serverId, targetPath),
    onSuccess: invalidate,
  });
  const copy = useMutation({
    mutationFn: ({ srcPath, destPath }) => filesApi.copy(serverId, srcPath, destPath),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: ({ srcPath, destPath }) => filesApi.move(serverId, srcPath, destPath),
    onSuccess: invalidate,
  });
  const upload = useMutation({
    mutationFn: ({ files, destPath, onUploadProgress }) =>
      filesApi.upload(serverId, destPath || path, files, { onUploadProgress }),
    onSuccess: invalidate,
  });

  return { mkdir, rename, remove, copy, move, upload, invalidate };
}
