import { Button, FileUpload, Label, type UploadedFile, toast } from '@go-tech-frontend/ui';
import { Banknote, Check, Copy, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// FPS Account Info
const fpsAccountInfo = {
  accountName: 'ABC Property Management Ltd',
  bankName: '香港上海匯豐銀行',
  accountNumber: '123-456789-001',
  fpsId: '1234567',
  fpsPhone: '91234567'
};

const fallbackCopyTextToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    textArea.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  `;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy command failed:', err);
    }

    document.body.removeChild(textArea);

    if (successful) {
      resolve();
    } else {
      reject(new Error('Fallback copy failed'));
    }
  });
};

export default function Fps({
  handleBackToPaymentMethods,
  handleFpsPaymentConfirm,
  price
}: {
  handleBackToPaymentMethods: () => void;
  handleFpsPaymentConfirm: (voucherFile: UploadedFile) => void;
  price: number;
}) {
  const { token } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Type': 'platform_customer'
  };

  useEffect(() => {
    return () => {
      // oxlint-disable
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleFileChange = (files: UploadedFile[]) => {
    const file = files[0];
    if (!file) return;
    if (file.status !== 'success') return;
    setUploadedFile(file);
  };

  const handleCopy = async (text: string, field: string) => {
    // 清理之前的timeout
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field]!);
      timeoutRefs.current[field] = null;
    }

    try {
      // 检查是否在浏览器环境中
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        await fallbackCopyTextToClipboard(text);
        setCopiedField(field);
        toast.success('已複製到剪貼板');
        timeoutRefs.current[field] = setTimeout(() => setCopiedField(null), 2000);
        return;
      }

      // 检查是否为安全上下文
      if (window.isSecureContext) {
        try {
          // 检查剪贴板写入权限（可选）
          if (navigator.permissions) {
            const permission = await navigator.permissions.query({
              name: 'clipboard-write' as PermissionName
            });

            // oxlint-disable eslint/max-depth
            if (permission.state === 'granted' || permission.state === 'prompt') {
              await navigator.clipboard.writeText(text);
              setCopiedField(field);
              toast.success('已複製到剪貼板');
              timeoutRefs.current[field] = setTimeout(() => setCopiedField(null), 2000);
              return;
            }
          }

          // 如果没有权限API或权限被拒绝，直接尝试写入
          await navigator.clipboard.writeText(text);
          setCopiedField(field);
          toast.success('已複製到剪貼板');
          timeoutRefs.current[field] = setTimeout(() => setCopiedField(null), 2000);
        } catch (clipboardError) {
          console.warn('Clipboard API failed, using fallback:', clipboardError);
          await fallbackCopyTextToClipboard(text);
          setCopiedField(field);
          toast.success('已複製到剪貼板');
          timeoutRefs.current[field] = setTimeout(() => setCopiedField(null), 2000);
        }
      } else {
        // 非安全上下文，使用备用方法
        await fallbackCopyTextToClipboard(text);
        setCopiedField(field);
        toast.success('已複製到剪貼板');
        timeoutRefs.current[field] = setTimeout(() => setCopiedField(null), 2000);
      }
    } catch (error) {
      console.error('复制操作失败:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  const cancelPayment = () => {
    setUploadedFile(null);
    handleBackToPaymentMethods();
  };

  const confirmPayment = () => {
    if (!uploadedFile) {
      toast.error('請上傳支付憑證');
      return;
    }
    handleFpsPaymentConfirm(uploadedFile);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Payment Amount */}
      <div className="text-center p-4 bg-primary/5 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">應付金額</p>
        <p className="text-3xl font-bold text-primary">${price.toLocaleString()} HKD</p>
      </div>

      {/* Account Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" />
          收款賬戶信息
        </h4>
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">賬戶名稱</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fpsAccountInfo.accountName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(fpsAccountInfo.accountName, 'accountName')}
              >
                {copiedField === 'accountName' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">銀行名稱</span>
            <span className="text-sm font-medium">{fpsAccountInfo.bankName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">銀行賬號</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fpsAccountInfo.accountNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(fpsAccountInfo.accountNumber, 'accountNumber')}
              >
                {copiedField === 'accountNumber' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">FPS ID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fpsAccountInfo.fpsId}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(fpsAccountInfo.fpsId, 'fpsId')}
              >
                {copiedField === 'fpsId' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">FPS 手機號碼</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fpsAccountInfo.fpsPhone}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(fpsAccountInfo.fpsPhone, 'fpsPhone')}
              >
                {copiedField === 'fpsPhone' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
        <Label className="font-medium flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          上傳支付憑證
        </Label>
        <FileUpload
          headers={headers}
          uploadUrl="/pms-resource/web-back/minio/upload"
          maxCount={1}
          onChange={handleFileChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={cancelPayment} className="flex-1">
          返回
        </Button>
        <Button onClick={confirmPayment} className="flex-1" disabled={!uploadedFile}>
          確認提交
        </Button>
      </div>
    </div>
  );
}
