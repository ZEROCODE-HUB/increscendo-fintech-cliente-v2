import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, X, Image, FileText } from "lucide-react";
import { PendingLoan } from "@/types/loans";
import { supabase } from "@/lib/supabase";

interface INECURPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: PendingLoan | null;
  type: 'ine' | 'curp';
}

export const INECURPModal = ({ open, onOpenChange, loan, type }: INECURPModalProps) => {
  const [documents, setDocuments] = useState<{ ineFrontUrl?: string; ineBackUrl?: string; curpUrl?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && loan?.user_id) {
      setLoading(true);
      supabase
        .from('users')
        .select('ine_front_url, ine_back_url, curp_url')
        .eq('id', loan.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDocuments({
              ineFrontUrl: data.ine_front_url,
              ineBackUrl: data.ine_back_url,
              curpUrl: data.curp_url
            });
          }
          setLoading(false);
        });
    }
  }, [open, loan?.user_id]);

  const handleClose = () => onOpenChange(false);

  const openInNewTab = (url: string) => window.open(url, '_blank');
  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type === 'ine' ? 'Documentos INE' : 'Documento CURP'}</DialogTitle>
          <DialogDescription>
            {loan.firstName} {loan.lastName} - {loan.id}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando documentos...</p>
          </div>
        ) : type === 'ine' ? (
          <Tabs defaultValue="front" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front">Frontal</TabsTrigger>
              <TabsTrigger value="back">Trasera</TabsTrigger>
            </TabsList>
            <TabsContent value="front" className="space-y-3">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[250px] max-h-[400px] flex items-center justify-center overflow-hidden">
                {documents.ineFrontUrl ? (
                  <img 
                    src={documents.ineFrontUrl} 
                    alt="INE Frontal" 
                    className="max-h-[380px] max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openInNewTab(documents.ineFrontUrl!)} 
                  />
                ) : (
                  <div className="text-center">
                    <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-muted-foreground">Sin imagen frontal</p>
                  </div>
                )}
              </div>
              {documents.ineFrontUrl && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openInNewTab(documents.ineFrontUrl!)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver completo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadFile(documents.ineFrontUrl!, 'ine-frente.jpg')}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="back" className="space-y-3">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[250px] max-h-[400px] flex items-center justify-center overflow-hidden">
                {documents.ineBackUrl ? (
                  <img 
                    src={documents.ineBackUrl} 
                    alt="INE Trasera" 
                    className="max-h-[380px] max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openInNewTab(documents.ineBackUrl!)} 
                  />
                ) : (
                  <div className="text-center">
                    <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-muted-foreground">Sin imagen trasera</p>
                  </div>
                )}
              </div>
              {documents.ineBackUrl && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openInNewTab(documents.ineBackUrl!)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver completo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadFile(documents.ineBackUrl!, 'ine-atras.jpg')}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[250px] flex items-center justify-center">
              {documents.curpUrl ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-red-400 mb-2" />
                  <p className="text-sm font-medium mb-3">Documento CURP (PDF)</p>
                  <Button variant="outline" size="sm" onClick={() => openInNewTab(documents.curpUrl!)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver PDF
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin documento CURP</p>
                </div>
              )}
            </div>
            {documents.curpUrl && (
              <Button variant="outline" size="sm" onClick={() => downloadFile(documents.curpUrl!, 'curp.pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button onClick={handleClose}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
