import { useResumeDownloads } from '../hooks/useResumeDownloads';
import { useResumeUploads } from '../hooks/useResumeUploads';
import { useUiStore } from '../store/uiStore';
import { DownloadTray } from './DownloadTray';
import { UploadTray } from './UploadTray';

export function TransferTrayStack() {
  useResumeUploads();
  useResumeDownloads();

  const uploads = useUiStore((s) => s.uploads);
  const downloads = useUiStore((s) => s.downloads);

  if (!uploads.length && !downloads.length) return null;

  return (
    <div className="fixed right-6 bottom-6 z-[60] flex w-80 flex-col gap-3">
      {downloads.length > 0 && <DownloadTray />}
      {uploads.length > 0 && <UploadTray />}
    </div>
  );
}
