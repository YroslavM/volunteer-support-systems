import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 font-heading mb-6">
            {t('about.title', 'Про нас')}
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            {t('about.intro', 'Інформаційна система волонтерської діяльності - це платформа для об\'єднання волонтерів, координаторів та донорів з метою вирішення соціально важливих проблем.')}
          </p>
        </div>

        <div className="mt-16">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {t('about.mission.title', 'Наша місія')}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading">
              {t('about.mission.subtitle', 'Покращувати життя через волонтерство')}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t('about.mission.description', 'Ми прагнемо створити ефективну екосистему для волонтерських проєктів, що дозволить максимізувати їх позитивний вплив на суспільство.')}
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-16">
              <div className="border-t border-gray-200 pt-10">
                <h3 className="text-2xl font-extrabold text-gray-900 font-heading">
                  {t('about.history.title', 'Наша історія')}
                </h3>
                <p className="mt-4 text-lg text-gray-500">
                  {t('about.history.content', 'Платформа була створена в 2023 році як відповідь на зростаючу потребу в координації волонтерських зусиль в Україні. Ми почали з невеликої групи ентузіастів і швидко зросли до національної мережі, що об\'єднує тисячі волонтерів, сотні проєктів та десятки організацій.')}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-10">
                <h3 className="text-2xl font-extrabold text-gray-900 font-heading">
                  {t('about.values.title', 'Наші цінності')}
                </h3>
                <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3">
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.transparency', 'Прозорість')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.transparency.desc', 'Ми забезпечуємо повну прозорість щодо цілей, фінансування та результатів усіх проєктів.')}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.respect', 'Повага')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.respect.desc', 'Ми цінуємо внесок кожного учасника і поважаємо різноманітність думок та підходів.')}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.impact', 'Вплив')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.impact.desc', 'Ми фокусуємося на проєктах з вимірюваним і значущим соціальним впливом.')}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.innovation', 'Інновації')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.innovation.desc', 'Ми шукаємо нові підходи до вирішення соціальних проблем і постійно вдосконалюємо нашу платформу.')}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.community', 'Спільнота')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.community.desc', 'Ми будуємо потужну спільноту однодумців, об\'єднаних спільними цілями та цінностями.')}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{t('about.values.responsibility', 'Відповідальність')}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{t('about.values.responsibility.desc', 'Ми відповідально ставимося до наших зобов\'язань перед волонтерами, бенефіціарами та суспільством в цілому.')}</dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-gray-200 pt-10">
                <h3 className="text-2xl font-extrabold text-gray-900 font-heading">
                  {t('about.team.title', 'Наша команда')}
                </h3>
                <p className="mt-4 text-lg text-gray-500">
                  {t('about.team.content', 'Нашу команду складають професіонали з різних галузей, об\'єднані спільним бажанням змінювати світ на краще. Ми поєднуємо досвід у технологіях, соціальній роботі, менеджменті та комунікаціях для створення максимально ефективної платформи для волонтерства.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}