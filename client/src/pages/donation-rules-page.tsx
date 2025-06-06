import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, FileText, AlertCircle } from "lucide-react";

export default function DonationRulesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Кнопка повернення */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-5 w-5" />
            Повернутися назад
          </Button>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Правила переказування коштів</h1>
          <p className="text-gray-600">Умови та порядок здійснення пожертв на платформі Dobrodiy</p>
        </div>

        <div className="space-y-6">
          {/* Загальні положення */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Загальні положення
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. Платформа Dobrodiy забезпечує прозорий та безпечний процес збору коштів для благодійних проєктів.
              </p>
              <p className="text-gray-700">
                2. Всі пожертви здійснюються на добровільній основі та є безоплатними.
              </p>
              <p className="text-gray-700">
                3. Користувач несе повну відповідальність за достовірність наданої інформації.
              </p>
            </CardContent>
          </Card>

          {/* Порядок здійснення пожертв */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Порядок здійснення пожертв
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. Мінімальна сума пожертви становить 1 гривню.
              </p>
              <p className="text-gray-700">
                2. Максимальна сума не може перевищувати залишок до збору цільової суми проєкту.
              </p>
              <p className="text-gray-700">
                3. Всі кошти надходять безпосередньо на рахунок організатора проєкту.
              </p>
              <p className="text-gray-700">
                4. Платформа не стягує комісію з донорів, але можуть застосовуватись комісії платіжних систем.
              </p>
            </CardContent>
          </Card>

          {/* Способи оплати */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Доступні способи оплати
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. <strong>Visa, Master Card / LiqPay / Приват24</strong> - онлайн оплата картою
              </p>
              <p className="text-gray-700">
                2. <strong>Готівкою у відділенні банку</strong> - переказ через касу банку
              </p>
              <p className="text-gray-700">
                Обираючи спосіб оплати, ви погоджуєтесь з умовами відповідної платіжної системи.
              </p>
            </CardContent>
          </Card>

          {/* Конфіденційність */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Конфіденційність та безпека
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. Email-адреса донора не відображається публічно.
              </p>
              <p className="text-gray-700">
                2. Ви можете обрати анонімну пожертву, тоді ваше ім'я не буде відображатись у списку донорів.
              </p>
              <p className="text-gray-700">
                3. Всі персональні дані захищені відповідно до законодавства про захист персональних даних.
              </p>
            </CardContent>
          </Card>

          {/* Відповідальність */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Відповідальність сторін
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. Платформа Dobrodiy виступає лише посередником між донорами та організаторами проєктів.
              </p>
              <p className="text-gray-700">
                2. Відповідальність за цільове використання коштів несе організатор проєкту.
              </p>
              <p className="text-gray-700">
                3. Платформа не несе відповідальності за неналежне виконання зобов'язань організаторами проєктів.
              </p>
              <p className="text-gray-700">
                4. У разі виявлення порушень організатором, платформа залишає за собою право заблокувати проєкт.
              </p>
            </CardContent>
          </Card>

          {/* Повернення коштів */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Повернення коштів
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                1. Повернення коштів можливе лише у випадках, передбачених законодавством.
              </p>
              <p className="text-gray-700">
                2. Запит на повернення коштів має бути поданий протягом 14 днів з моменту здійснення пожертви.
              </p>
              <p className="text-gray-700">
                3. Рішення про повернення коштів приймається адміністрацією платформи індивідуально.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Контактна інформація */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Контактна інформація</CardTitle>
            <CardDescription>
              У разі виникнення питань або проблем, звертайтесь до служби підтримки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Email: support@dobrodiy.com<br />
              Телефон: +380 (44) 123-45-67<br />
              Час роботи: Пн-Пт з 9:00 до 18:00
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Останнє оновлення: 06 червня 2025 року
          </p>
        </div>
      </div>
    </div>
  );
}