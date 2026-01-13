import { useState } from "react";
import { Button, Input, Textarea, Dialog, DialogContent } from "@/components/ui";
import { X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show success dialog
    setShowSuccess(true);
    // Reset form
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 pt-32 pb-16 bg-linear-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-10">
              聯繫我們
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-foreground mb-2">
                  姓名 <span className="text-primary">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="請輸入您的姓名"
                  required
                  className="h-12 border-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-foreground mb-2">
                  電子郵箱 <span className="text-primary">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="請輸入您的電子郵箱"
                  required
                  className="h-12 border-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-foreground mb-2">
                  聯繫電話 <span className="text-primary">*</span>
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="請輸入您的聯繫電話"
                  required
                  className="h-12 border-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-foreground mb-2">
                  您想說的 <span className="text-primary">*</span>
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="請輸入您想對我們說的"
                  required
                  className="min-h-30 border-gray-300 resize-none"
                />
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full max-w-xs mx-auto block h-12 text-lg"
                >
                  發送
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center p-8">
          <button
            onClick={() => setShowSuccess(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-4">發送成功</h2>
          <p className="text-muted-foreground">
            我們看到後會第一時間跟您聯繫，請耐心等待並保持電話暢通。
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
