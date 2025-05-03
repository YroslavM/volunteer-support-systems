import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Ім'я має містити мінімум 2 символи" }),
  email: z.string().email({ message: "Введіть коректний email" }),
  subject: z.string().min(5, { message: "Тема має містити мінімум 5 символів" }),
  message: z.string().min(10, { message: "Повідомлення має містити мінімум 10 символів" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });
  
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Повідомлення відправлено",
      description: "Дякуємо за ваше звернення! Ми зв'яжемося з вами найближчим часом.",
    });
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    form.reset();
  };
  
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 font-heading mb-6">
            {t('contacts.title', 'Контакти')}
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            {t('contacts.intro', 'Зв\'яжіться з нами, якщо у вас є запитання чи пропозиції. Ми завжди раді допомогти та почути ваші думки.')}
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('contacts.contactInfo', 'Контактна інформація')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('contacts.phone', 'Телефон')}
                      </p>
                      <p className="text-sm text-gray-600">+380 (44) 123-45-67</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('contacts.email', 'Email')}
                      </p>
                      <p className="text-sm text-gray-600">info@volunteer-platform.ua</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('contacts.address', 'Адреса')}
                      </p>
                      <p className="text-sm text-gray-600">
                        вул. Хрещатик, 10<br />
                        Київ, 01001<br />
                        Україна
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('contacts.workingHours', 'Години роботи')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">{t('contacts.weekdays', 'Понеділок - П\'ятниця')}</p>
                    <p className="text-sm text-gray-900 font-medium">9:00 - 18:00</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">{t('contacts.saturday', 'Субота')}</p>
                    <p className="text-sm text-gray-900 font-medium">10:00 - 15:00</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">{t('contacts.sunday', 'Неділя')}</p>
                    <p className="text-sm text-gray-900 font-medium">{t('contacts.closed', 'Вихідний')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {t('contacts.contactForm', 'Форма зворотного зв\'язку')}
                </h3>
                
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-medium text-gray-900">
                      {t('contacts.messageSent', 'Повідомлення відправлено!')}
                    </h4>
                    <p className="text-gray-500 text-center max-w-md">
                      {t('contacts.thankYou', 'Дякуємо за ваше звернення. Наша команда розгляне його найближчим часом і зв\'яжеться з вами.')}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)}
                      className="mt-4"
                    >
                      {t('contacts.sendAnother', 'Надіслати ще одне повідомлення')}
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('contacts.form.name', 'Ім\'я')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('contacts.form.namePlaceholder', 'Ваше ім\'я')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('contacts.form.email', 'Email')}</FormLabel>
                              <FormControl>
                                <Input placeholder="example@email.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contacts.form.subject', 'Тема')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('contacts.form.subjectPlaceholder', 'Тема повідомлення')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contacts.form.message', 'Повідомлення')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('contacts.form.messagePlaceholder', 'Ваше повідомлення...')} 
                                className="min-h-[150px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('contacts.form.sending', 'Відправлення...')}
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Send className="mr-2 h-4 w-4" />
                            {t('contacts.form.send', 'Відправити повідомлення')}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Map */}
        <div className="mt-16 bg-gray-100 rounded-lg overflow-hidden shadow-md">
          <div className="aspect-w-16 aspect-h-8 lg:aspect-h-6">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.575349430496!2d30.520084476892357!3d50.44848288850972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4ce50f8b6e3c3%3A0xb528dc4d6dadc4f8!2z0LLRg9C70LjRhtGPINCl0YDQtdGJ0LDRgtC40LosIDEwLCDQmtC40ZfQsiwgMDEwMDE!5e0!3m2!1suk!2sua!4v1699449437883!5m2!1suk!2sua" 
              width="100%" 
              height="450" 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Map of our office location"
              className="w-full h-full border-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}