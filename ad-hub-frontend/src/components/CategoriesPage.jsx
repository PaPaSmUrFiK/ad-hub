import { Header } from './Header';
import { Footer } from './Footer';
import {
  Smartphone,
  Shirt,
  Home,
  Car,
  Sofa,
  Briefcase,
  Baby,
  Dumbbell,
  Book,
  Wrench,
  Palette,
  Music,
  ChevronRight
} from 'lucide-react';

const categories = [
  {
    name: 'Электроника',
    icon: Smartphone,
    count: '5,240',
    subcategories: ['Телефоны', 'Ноутбуки', 'Планшеты', 'ТВ и видео', 'Аудиотехника', 'Фототехника'],
    color: 'bg-cyan-100 text-cyan-700',
    darkColor: 'dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    name: 'Одежда и обувь',
    icon: Shirt,
    count: '3,850',
    subcategories: ['Женская одежда', 'Мужская одежда', 'Обувь', 'Аксессуары', 'Детская одежда'],
    color: 'bg-violet-100 text-violet-700',
    darkColor: 'dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    name: 'Недвижимость',
    icon: Home,
    count: '2,120',
    subcategories: ['Квартиры', 'Дома', 'Коммерческая', 'Земельные участки', 'Аренда'],
    color: 'bg-emerald-100 text-emerald-700',
    darkColor: 'dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    name: 'Авто и транспорт',
    icon: Car,
    count: '4,560',
    subcategories: ['Легковые авто', 'Грузовики', 'Мототехника', 'Запчасти', 'Шины и диски'],
    color: 'bg-rose-100 text-rose-700',
    darkColor: 'dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    name: 'Мебель и интерьер',
    icon: Sofa,
    count: '1,890',
    subcategories: ['Диваны и кресла', 'Столы и стулья', 'Шкафы', 'Декор', 'Освещение'],
    color: 'bg-amber-100 text-amber-700',
    darkColor: 'dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    name: 'Работа и бизнес',
    icon: Briefcase,
    count: '3,200',
    subcategories: ['Вакансии', 'Резюме', 'Бизнес и оборудование', 'Услуги'],
    color: 'bg-sky-100 text-sky-700',
    darkColor: 'dark:bg-sky-900/30 dark:text-sky-400',
  },
  {
    name: 'Детские товары',
    icon: Baby,
    count: '2,340',
    subcategories: ['Детская мебель', 'Игрушки', 'Коляски', 'Автокресла', 'Одежда'],
    color: 'bg-pink-100 text-pink-700',
    darkColor: 'dark:bg-pink-900/30 dark:text-pink-400',
  },
  {
    name: 'Спорт и отдых',
    icon: Dumbbell,
    count: '1,560',
    subcategories: ['Велосипеды', 'Тренажеры', 'Туризм', 'Зимний спорт', 'Водный спорт'],
    color: 'bg-orange-100 text-orange-700',
    darkColor: 'dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    name: 'Книги и журналы',
    icon: Book,
    count: '890',
    subcategories: ['Художественная литература', 'Учебники', 'Журналы', 'Комиксы'],
    color: 'bg-indigo-100 text-indigo-700',
    darkColor: 'dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    name: 'Инструменты',
    icon: Wrench,
    count: '1,230',
    subcategories: ['Электроинструменты', 'Ручной инструмент', 'Садовый инвентарь'],
    color: 'bg-stone-200 text-stone-700',
    darkColor: 'dark:bg-stone-800/30 dark:text-stone-400',
  },
  {
    name: 'Хобби и творчество',
    icon: Palette,
    count: '1,450',
    subcategories: ['Рукоделие', 'Художественные товары', 'Коллекционирование'],
    color: 'bg-teal-100 text-teal-700',
    darkColor: 'dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    name: 'Музыкальные инструменты',
    icon: Music,
    count: '670',
    subcategories: ['Гитары', 'Клавишные', 'Духовые', 'Звуковое оборудование'],
    color: 'bg-purple-100 text-purple-700',
    darkColor: 'dark:bg-purple-900/30 dark:text-purple-400',
  },
];

export function CategoriesPage({
  isDarkTheme,
  onToggleTheme,
  isAuthenticated,
  onLoginClick,
  onLogout,
  onNavigate
}) {
  const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
  const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
  const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
  const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
  const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
  const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
  const hoverBg = isDarkTheme ? 'hover:bg-neutral-800' : 'hover:bg-stone-50';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Header
        onLoginClick={onLoginClick}
        onRegisterClick={onLoginClick}
        onFavoritesClick={() => onNavigate('favorites')}
        onLogout={onLogout}
        isAuthenticated={isAuthenticated}
        isDarkTheme={isDarkTheme}
        onToggleTheme={onToggleTheme}
        currentPage="categories"
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`${textColor} mb-2 text-3xl font-bold`}>Все категории</h1>
          <p className={textSecondary}>Выберите категорию для просмотра объявлений</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.name}
                className={`${cardBg} rounded-xl border ${borderColor} p-6 ${hoverBg} transition-all cursor-pointer group`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl ${isDarkTheme ? category.darkColor : category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={textColor}>{category.name}</h3>
                      <ChevronRight className={`h-5 w-5 ${textMuted} ${isDarkTheme ? 'group-hover:text-orange-500' : 'group-hover:text-teal-600'} transition-colors`} />
                    </div>
                    <p className={textMuted}>{category.count} объявлений</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <button
                      key={sub}
                      className={`block w-full text-left ${textSecondary} ${isDarkTheme ? 'hover:text-orange-400' : 'hover:text-teal-600'} transition-colors`}
                    >
                      • {sub}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  );
}
