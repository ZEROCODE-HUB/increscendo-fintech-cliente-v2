import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Image, RefreshCw, AlertCircle, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { increscendoApiFetch } from "@/lib/increscendoApi";
import { useToast } from "@/hooks/use-toast";

interface ConsentRenewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any | null;
  onSuccess?: () => void;
}

const uploadFileToStorage = async (file: File, folder: string, fileName: string): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('User not authenticated');
    const filePath = `${folder}/${userId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return publicUrl?.publicUrl || null;
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err);
    return null;
  }
};

const urlToFile = async (url: string, filename: string): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = filename.split('.').pop() || 'jpg';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    pdf: 'application/pdf',
  };
  return new File([blob], filename, { type: mimeTypes[ext] || blob.type || 'application/octet-stream' });
};

export const ConsentRenewModal = ({ open, onOpenChange, loan, onSuccess }: ConsentRenewModalProps) => {
  const [documents, setDocuments] = useState<{ ineFrontUrl?: string; ineBackUrl?: string; curpUrl?: string; selfieUrl?: string; contractUrl?: string }>({});
  const [newFiles, setNewFiles] = useState<{ ineFront?: File; ineBack?: File; curp?: File; selfie?: File; contract?: File }>({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const { toast } = useToast();

  const ineFrontRef = useRef<HTMLInputElement>(null);
  const ineBackRef = useRef<HTMLInputElement>(null);
  const curpRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const contractRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && loan?.user_id) {
      setLoadingDocs(true);
      setNewFiles({});
      supabase
        .from('users')
        .select('ine_front_url, ine_back_url, curp_url, selfie_url, contract_url')
        .eq('id', loan.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDocuments({
              ineFrontUrl: data.ine_front_url,
              ineBackUrl: data.ine_back_url,
              curpUrl: data.curp_url,
              selfieUrl: data.selfie_url,
              contractUrl: data.contract_url
            });
          }
          setLoadingDocs(false);
        });
    }
  }, [open, loan?.user_id]);

  const handleFileSelect = (type: 'ineFront' | 'ineBack' | 'curp' | 'selfie' | 'contract') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const clearFile = (type: 'ineFront' | 'ineBack' | 'curp' | 'selfie' | 'contract') => {
    setNewFiles(prev => ({ ...prev, [type]: undefined }));
  };

  const getPreviewUrl = (type: 'ineFront' | 'ineBack' | 'curp' | 'selfie' | 'contract'): string | undefined => {
    const file = newFiles[type];
    if (file) return URL.createObjectURL(file);
    if (type === 'ineFront') return documents.ineFrontUrl;
    if (type === 'ineBack') return documents.ineBackUrl;
    if (type === 'curp') return documents.curpUrl;
    if (type === 'selfie') return documents.selfieUrl;
    return documents.contractUrl;
  };

  const getFileName = (type: 'ineFront' | 'ineBack' | 'curp' | 'selfie' | 'contract'): string | undefined => {
    return newFiles[type]?.name;
  };

  const handleRenew = async () => {
    if (!loan?.uuid || !loan?.user_id) return;
    setRenewing(true);
    try {
      const updates: Record<string, string> = {};
      const timestamp = Date.now();

      if (newFiles.ineFront) {
        const url = await uploadFileToStorage(newFiles.ineFront, 'ine-documents', `ine_front_${timestamp}.jpg`);
        if (url) updates.ine_front_url = url;
      }
      if (newFiles.ineBack) {
        const url = await uploadFileToStorage(newFiles.ineBack, 'ine-documents', `ine_back_${timestamp}.jpg`);
        if (url) updates.ine_back_url = url;
      }
      if (newFiles.curp) {
        const ext = newFiles.curp.name.split('.').pop() || 'pdf';
        const url = await uploadFileToStorage(newFiles.curp, 'curp-documents', `curp_${timestamp}.${ext}`);
        if (url) updates.curp_url = url;
      }
      if (newFiles.selfie) {
        const url = await uploadFileToStorage(newFiles.selfie, 'ine-documents', `selfie_ine_${timestamp}.jpg`);
        if (url) updates.selfie_url = url;
      }
      if (newFiles.contract) {
        const ext = newFiles.contract.name.split('.').pop() || 'pdf';
        const url = await uploadFileToStorage(newFiles.contract, 'contract-documents', `contract_${timestamp}.${ext}`);
        if (url) updates.contract_url = url;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', loan.user_id);
        if (updateError) throw updateError;
      }

      const formData = new FormData();
      formData.append('loan_id', loan.uuid);

      const appendFile = async (type: 'ineFront' | 'ineBack' | 'selfie' | 'contract', fieldName: string, filename: string) => {
        const file = newFiles[type];
        if (file) {
          formData.append(fieldName, file, file.name);
        } else {
          const existingUrl = ({
            ineFront: documents.ineFrontUrl,
            ineBack: documents.ineBackUrl,
            selfie: documents.selfieUrl,
            contract: documents.contractUrl
          } as const)[type];
          if (existingUrl) {
            const downloaded = await urlToFile(existingUrl, filename);
            formData.append(fieldName, downloaded, filename);
          }
        }
      };

      await appendFile('ineFront', 'ine_front', 'ine_front.jpg');
      await appendFile('ineBack', 'ine_back', 'ine_back.jpg');
      await appendFile('selfie', 'selfie', 'selfie.jpg');
      await appendFile('contract', 'contract', 'contract.pdf');

      const res = await increscendoApiFetch('/belvo/consents/renew', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Error ${res.status}`);
      }
      const result = await res.json();
      toast({
        title: "Consentimiento renovado",
        description: `Nuevo consent ID: ${result.data?.id?.slice(0, 8)}...`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error al renovar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRenewing(false);
    }
  };

  const openInNewTab = (url: string) => window.open(url, '_blank');

  if (!loan) return null;

  const renderDocumentTab = (
    type: 'ineFront' | 'ineBack' | 'curp' | 'selfie' | 'contract',
    label: string,
    isImage: boolean,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    const previewUrl = getPreviewUrl(type);
    const fileName = getFileName(type);
    const hasNewFile = !!newFiles[type];

    return (
      <TabsContent value={type} className="space-y-3">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[250px] flex items-center justify-center overflow-hidden relative">
          {previewUrl ? (
            isImage ? (
              <img
                src={previewUrl}
                alt={label}
                className="max-h-[380px] max-w-full object-contain"
              />
            ) : (
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-red-400 mb-2" />
                <p className="text-sm font-medium mb-3">{fileName || 'Documento CURP (PDF)'}</p>
                <Button variant="outline" size="sm" onClick={() => openInNewTab(previewUrl)}>
                  <Eye className="h-4 w-4 mr-2" /> Ver PDF
                </Button>
              </div>
            )
          ) : (
            <div className="text-center">
              {isImage ? (
                <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              ) : (
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              )}
              <p className="text-sm text-muted-foreground">Sin documento</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {hasNewFile ? 'Cambiar archivo' : 'Subir archivo'}
          </Button>
          {hasNewFile && (
            <Button variant="ghost" size="sm" onClick={() => clearFile(type)}>
              <X className="h-4 w-4 mr-2" />
              Quitar
            </Button>
          )}
          {previewUrl && isImage && (
            <Button variant="outline" size="sm" onClick={() => openInNewTab(previewUrl)}>
              <Eye className="h-4 w-4 mr-2" /> Ver completo
            </Button>
          )}
        </div>

        {hasNewFile && fileName && (
          <p className="text-xs text-muted-foreground">Nuevo: {fileName}</p>
        )}

        <input
          ref={ref}
          type="file"
          accept={isImage ? 'image/*' : '.pdf'}
          className="hidden"
          onChange={handleFileSelect(type)}
        />
      </TabsContent>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renovar Consentimiento</DialogTitle>
          <DialogDescription>
            {loan.firstName} {loan.lastName} - {loan.id}
          </DialogDescription>
        </DialogHeader>

        {loadingDocs ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando documentos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Puedes reemplazar los documentos actuales del usuario antes de enviarlos nuevamente a Belvo para renovar el consentimiento.
              </p>
            </div>

            <Tabs defaultValue="ineFront" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="ineFront">
                  INE Frontal
                  {newFiles.ineFront && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="ineBack">
                  INE Trasera
                  {newFiles.ineBack && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="curp">
                  CURP
                  {newFiles.curp && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="selfie">
                  Selfie
                  {newFiles.selfie && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="contract">
                  Contrato
                  {newFiles.contract && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />}
                </TabsTrigger>
              </TabsList>

              {renderDocumentTab('ineFront', 'INE Frontal', true, ineFrontRef)}
              {renderDocumentTab('ineBack', 'INE Trasera', true, ineBackRef)}
              {renderDocumentTab('curp', 'CURP', false, curpRef)}
              {renderDocumentTab('selfie', 'Selfie', true, selfieRef)}
              {renderDocumentTab('contract', 'Contrato', false, contractRef)}
            </Tabs>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={renewing}>
            Cancelar
          </Button>
          <Button onClick={handleRenew} disabled={renewing || loadingDocs}>
            {renewing ? (
              <>Enviando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Reenviar documentos</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
