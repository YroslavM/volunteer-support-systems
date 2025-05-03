import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Users, 
  LightbulbIcon, 
  ClipboardList, 
  Handshake, 
  Globe, 
  ChevronRight 
} from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Image */}
        <div className="relative overflow-hidden rounded-xl mb-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary-foreground/30 mix-blend-multiply" />
            <img
              src="https://images.unsplash.com/photo-1593113598332-cd59a0c3a9a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
              alt="Волонтери працюють разом"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative py-24 px-8 sm:px-16 flex flex-col items-center text-center">
            <h1 className="text-4xl font-extrabold text-white font-heading mb-6 drop-shadow-md">
              {t('about.title', 'Про нас')}
            </h1>
            <p className="mt-4 text-xl text-white max-w-3xl mx-auto font-medium drop-shadow">
              {t('about.intro', 'Інформаційна система волонтерської діяльності - це платформа для об\'єднання волонтерів, координаторів та донорів з метою вирішення соціально важливих проблем.')}
            </p>
            <Button className="mt-8 bg-white text-primary hover:bg-gray-100">
              {t('about.joinUs', 'Приєднатися до нас')}
            </Button>
          </div>
        </div>

        {/* Mission Section with Card */}
        <div className="mt-16">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {t('about.mission.title', 'Наша місія')}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading">
              {t('about.mission.subtitle', 'Покращувати життя через волонтерство')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                alt="Волонтерські проєкти"
                className="rounded-lg shadow-md w-full h-80 object-cover"
              />
            </div>
            <div>
              <Card className="p-8">
                <p className="text-xl text-gray-700">
                  {t('about.mission.description', 'Ми прагнемо створити ефективну екосистему для волонтерських проєктів, що дозволить максимізувати їх позитивний вплив на суспільство.')}
                </p>
                <p className="mt-4 text-gray-600">
                  {t('about.mission.extended', 'Наша платформа з\'єднує тих, хто хоче допомогти, з тими, хто організовує волонтерські ініціативи, і тими, хто може надати фінансову підтримку. Ми віримо, що разом ми можемо зробити більше.')}
                </p>
                <div className="mt-6 flex items-center text-primary">
                  <a href="/projects" className="inline-flex items-center font-medium">
                    {t('about.mission.viewProjects', 'Переглянути проєкти')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </Card>
            </div>
          </div>

          {/* History Section */}
          <div className="mt-24">
            <div className="border-t border-gray-200 pt-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                  {t('about.history.title', 'Наша історія')}
                </h3>
                <p className="text-lg text-gray-500 mb-4">
                  {t('about.history.content', 'Платформа була створена в 2023 році як відповідь на зростаючу потребу в координації волонтерських зусиль в Україні. Ми почали з невеликої групи ентузіастів і швидко зросли до національної мережі, що об\'єднує тисячі волонтерів, сотні проєктів та десятки організацій.')}
                </p>
                <p className="text-lg text-gray-500">
                  {t('about.history.content2', 'За короткий час ми допомогли реалізувати понад 200 волонтерських проєктів по всій країні, залучивши більше 5000 волонтерів та зібравши понад 2 мільйони гривень на благодійні цілі.')}
                </p>
              </div>
              <div className="order-1 md:order-2">
                <img 
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                  alt="Волонтерська команда"
                  className="rounded-lg shadow-md w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Values Section - Cards */}
          <div className="mt-24 border-t border-gray-200 pt-10">
            <h3 className="text-2xl font-extrabold text-gray-900 font-heading mb-10 text-center">
              {t('about.values.title', 'Наші цінності')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <Heart className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.transparency', 'Прозорість')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.transparency.desc', 'Ми забезпечуємо повну прозорість щодо цілей, фінансування та результатів усіх проєктів.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.respect', 'Повага')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.respect.desc', 'Ми цінуємо внесок кожного учасника і поважаємо різноманітність думок та підходів.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <Globe className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.impact', 'Вплив')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.impact.desc', 'Ми фокусуємося на проєктах з вимірюваним і значущим соціальним впливом.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <LightbulbIcon className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.innovation', 'Інновації')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.innovation.desc', 'Ми шукаємо нові підходи до вирішення соціальних проблем і постійно вдосконалюємо нашу платформу.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <Handshake className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.community', 'Спільнота')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.community.desc', 'Ми будуємо потужну спільноту однодумців, об\'єднаних спільними цілями та цінностями.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-4 flex justify-center">
                  <ClipboardList className="h-12 w-12 text-primary" />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {t('about.values.responsibility', 'Відповідальність')}
                  </h4>
                  <p className="text-gray-600">
                    {t('about.values.responsibility.desc', 'Ми відповідально ставимося до наших зобов\'язань перед волонтерами, бенефіціарами та суспільством в цілому.')}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Team Section with Photos */}
          <div className="mt-24 border-t border-gray-200 pt-10">
            <h3 className="text-2xl font-extrabold text-gray-900 font-heading mb-10 text-center">
              {t('about.team.title', 'Наша команда')}
            </h3>
            <p className="text-lg text-gray-500 text-center max-w-3xl mx-auto mb-12">
              {t('about.team.content', 'Нашу команду складають професіонали з різних галузей, об\'єднані спільним бажанням змінювати світ на краще. Ми поєднуємо досвід у технологіях, соціальній роботі, менеджменті та комунікаціях для створення максимально ефективної платформи для волонтерства.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  name: t('about.team.member1.name', 'Олена Петренко'),
                  role: t('about.team.member1.role', 'Засновниця'),
                  image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1698&q=80'
                },
                {
                  name: t('about.team.member2.name', 'Іван Ковальчук'),
                  role: t('about.team.member2.role', 'Технічний директор'),
                  image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80'
                },
                {
                  name: t('about.team.member3.name', 'Марія Захарчук'),
                  role: t('about.team.member3.role', 'Координаторка проєктів'),
                  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'
                },
                {
                  name: t('about.team.member4.name', 'Олексій Лисенко'),
                  role: t('about.team.member4.role', 'Менеджер комунікацій'),
                  image: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80'
                }
              ].map((member, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-full aspect-square mb-4 overflow-hidden rounded-lg">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{member.name}</h4>
                  <p className="text-gray-600">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Join Us Section */}
          <div className="mt-24 rounded-lg bg-primary/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-primary mb-4">
              {t('about.joinUs.title', 'Приєднуйтесь до нашої місії')}
            </h3>
            <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
              {t('about.joinUs.description', 'Станьте частиною нашої спільноти і допоможіть нам змінювати світ на краще. Як волонтер, координатор чи донор - ви можете зробити свій внесок у важливу справу.')}
            </p>
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
              {t('about.joinUs.button', 'Зареєструватися')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}