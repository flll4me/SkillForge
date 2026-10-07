CREATE TEMP TABLE question_text_translations (
  old_text TEXT PRIMARY KEY,
  new_text TEXT NOT NULL,
  option_texts JSONB NOT NULL
) ON COMMIT DROP;

INSERT INTO question_text_translations (old_text, new_text, option_texts)
VALUES
  ('What is the difference between let, const, and var?', 'Чем отличаются let, const и var?', jsonb_build_array('const запрещает повторно присваивать значение переменной', 'var имеет область видимости функции', 'let всегда становится глобальной переменной', 'const делает содержимое объекта полностью неизменяемым')),
  ('Which of these values is a primitive in JavaScript?', 'Какое из этих значений является примитивом JavaScript?', jsonb_build_array('Число 42', 'Функция', 'Массив', 'Экземпляр Date')),
  ('What does Array.prototype.map return?', 'Что возвращает Array.prototype.map?', jsonb_build_array('Новый массив с результатами вызова функции для каждого элемента', 'Первый элемент, подошедший под условие', 'Исходный массив, отсортированный на месте', 'Логическое значение')),
  ('What is a closure?', 'Что такое замыкание?', jsonb_build_array('Функция вместе с доступом к внешней лексической области видимости', 'Функция, которую можно вызвать только один раз', 'Блок, который автоматически перехватывает ошибки', 'Особый вид Promise')),
  ('Which statements about the event loop are correct?', 'Какие утверждения о цикле событий JavaScript верны?', jsonb_build_array('Обработчики Promise выполняются как микрозадачи', 'Долгая синхронная задача блокирует основной поток', 'Все таймеры выполняются раньше микрозадач', 'JavaScript всегда выполняет обработчики параллельно')),
  ('What does async/await do with a Promise?', 'Как async/await работает с Promise?', jsonb_build_array('await приостанавливает выполнение async-функции до завершения Promise', 'Любой отказ Promise автоматически превращается в успешное значение', 'await блокирует основной поток браузера', 'async/await полностью избавляет от обработки ошибок')),
  ('How does the prototype chain work?', 'Как работает цепочка прототипов?', jsonb_build_array('Поиск свойства продолжается по цепочке прототипов, пока свойство не найдено или цепочка не закончится', 'Каждый объект копирует все унаследованные свойства при создании', 'Прототипы есть только у массивов', 'Цепочка прототипов — это то же самое, что стек вызовов')),
  ('Which statements about JavaScript this are correct?', 'Какие утверждения о this в JavaScript верны?', jsonb_build_array('Стрелочная функция берёт this из окружающей области видимости', 'При вызове метода через объект this обычно указывает на объект слева от точки', 'this всегда указывает на функцию, внутри которой он написан', 'bind изменяет исходную функцию на месте')),
  ('Why is immutable state useful in UI applications?', 'Чем полезно неизменяемое состояние в интерфейсах?', jsonb_build_array('Новая ссылка помогает обнаруживать изменения состояния', 'Оно запрещает сборщику мусора удалять любые объекты', 'Оно делает сетевые запросы синхронными', 'Оно гарантирует, что состояние не может содержать некорректные данные')),
  ('What happens when a let variable is accessed before initialization?', 'Что произойдёт при обращении к let до её инициализации?', jsonb_build_array('Будет выброшена ReferenceError из-за временной мёртвой зоны', 'Переменная получит значение null', 'Создастся глобальная переменная', 'Объявление незаметно переместится в начало скрипта')),

  ('What does a TypeScript interface describe?', 'Что описывает интерфейс TypeScript?', jsonb_build_array('Структуру и допустимые свойства объекта', 'Работающий процесс JavaScript', 'Таблицу базы данных', 'CSS-селектор')),
  ('Which type is safer than any when a value is not yet known?', 'Какой тип безопаснее any, если тип значения пока неизвестен?', jsonb_build_array('unknown', 'void', 'never', 'object')),
  ('What does an optional property marker mean?', 'Что означает маркер необязательного свойства?', jsonb_build_array('Свойство может отсутствовать', 'Свойство всегда равно null', 'Свойство доступно только для чтения', 'Свойство является приватным')),
  ('What is a union type?', 'Что такое объединение типов (union type)?', jsonb_build_array('Значение может принадлежать одному из перечисленных типов', 'Тип, который объединяет два работающих процесса', 'Класс с несколькими конструкторами', 'Тип, существующий только во время выполнения')),
  ('What is a generic used for?', 'Для чего используют обобщённый тип (generic)?', jsonb_build_array('Для повторно используемого кода с сохранением информации о типе', 'Для генерации случайных значений', 'Для преобразования TypeScript в CSS', 'Чтобы запретить функциям возвращать значения')),
  ('What does keyof T produce?', 'Что возвращает keyof T?', jsonb_build_array('Объединение ключей типа T', 'Значения, хранящиеся в T', 'Копию T во время выполнения', 'Количество свойств в T')),
  ('Which statements about type narrowing are correct?', 'Какие утверждения о сужении типа верны?', jsonb_build_array('Проверка typeof может сузить объединённый тип', 'Проверка instanceof может сузить тип экземпляра класса', 'Сужение типа всегда меняет значение во время выполнения', 'Приведение типа проверяет входные данные во время выполнения')),
  ('What does never represent?', 'Что обозначает тип never?', jsonb_build_array('Значение, которое не может возникнуть', 'Любое возможное значение', 'Отсутствующее необязательное свойство', 'Ожидающий Promise')),
  ('What does the infer keyword do in a conditional type?', 'Что делает ключевое слово infer в условном типе?', jsonb_build_array('Извлекает тип для дальнейшего использования в условии', 'Загружает модуль во время выполнения', 'Извлекает значения из базы данных', 'Отключает проверку типов в файле')),
  ('Which statements about readonly are correct?', 'Какие утверждения о readonly верны?', jsonb_build_array('Запрещает присваивание через ссылку с этим типом', 'Не замораживает вложенные объекты во время выполнения', 'Шифрует свойство в памяти', 'Делает свойство необязательным')),

  ('What does a React component return?', 'Что возвращает компонент React?', jsonb_build_array('Описание интерфейса, обычно JSX', 'Подключение к базе данных', 'Только CSS-файл', 'Окно браузера')),
  ('What is a prop?', 'Что такое prop в React?', jsonb_build_array('Входные данные, переданные компоненту родителем', 'Глобальное событие браузера', 'CSS-анимация', 'Индекс базы данных')),
  ('What does useState provide?', 'Что возвращает useState?', jsonb_build_array('Значение состояния и функцию его обновления', 'Маршрут и URL', 'Сервер и сокет', 'Узел DOM и его CSS')),
  ('Why should list items have stable keys?', 'Зачем элементам списка нужны стабильные ключи key?', jsonb_build_array('Они помогают React сопоставлять элементы между перерисовками', 'Они шифруют значения списка', 'Они запрещают любые повторные рендеры', 'Они задают визуальный порядок через CSS')),
  ('When does an effect with an empty dependency array run?', 'Когда выполняется эффект с пустым массивом зависимостей?', jsonb_build_array('После монтирования компонента', 'Перед каждым рендером', 'Только при закрытии браузера', 'Только после обновления состояния')),
  ('Which statements about controlled inputs are correct?', 'Какие утверждения об управляемых полях ввода верны?', jsonb_build_array('Их отображаемое значение задаётся состоянием React', 'События изменения обновляют состояние', 'Пользователь не может их редактировать', 'Для каждого нажатия клавиши обязательно напрямую менять DOM')),
  ('What problem does context help solve?', 'Какую задачу помогает решить Context?', jsonb_build_array('Передачу общих значений через несколько уровней компонентов', 'Компиляцию JSX в браузере', 'Создание таблиц SQL', 'Замену любого локального состояния')),
  ('What does useMemo cache?', 'Что кэширует useMemo?', jsonb_build_array('Результат вычисления между рендерами, пока зависимости не изменились', 'Дерево компонентов в localStorage', 'Сетевой запрос навсегда', 'Обновление состояния до перезагрузки страницы')),
  ('Why must hooks be called in the same order on every render?', 'Почему хуки нужно вызывать в одинаковом порядке при каждом рендере?', jsonb_build_array('React связывает состояние хуков с порядком их вызова', 'Этого требует JavaScript для async-функций', 'Браузер сортирует хуки по алфавиту', 'Это нужно для сохранения CSS-специфичности')),
  ('Which statements about effect cleanup are correct?', 'Какие утверждения об очистке эффекта верны?', jsonb_build_array('Очистка выполняется перед повторным эффектом при изменившихся зависимостях', 'Очистка выполняется при размонтировании компонента', 'Очистка автоматически отменяет любой Promise', 'Очистка выполняется до первой настройки эффекта')),

  ('What is Node.js?', 'Что такое Node.js?', jsonb_build_array('Среда выполнения JavaScript вне браузера', 'Фреймворк JavaScript для оформления страниц', 'Реляционная база данных', 'API расширений браузера')),
  ('Which global object provides process information?', 'Какой глобальный объект содержит сведения о процессе Node.js?', jsonb_build_array('process', 'document', 'window', 'navigator')),
  ('What does npm primarily help manage?', 'Для чего в первую очередь нужен npm?', jsonb_build_array('Пакеты JavaScript и команды проекта', 'Пользователи операционной системы', 'Файлы cookie браузера', 'Только резервные копии базы данных')),
  ('What is the event loop responsible for?', 'За что отвечает цикл событий Node.js?', jsonb_build_array('Планирует выполнение обработчиков асинхронных операций', 'Рисует HTML-элементы', 'Компилирует схемы SQL', 'Шифрует исходные файлы')),
  ('Which statements about CommonJS modules are correct?', 'Какие утверждения о модулях CommonJS верны?', jsonb_build_array('require загружает модуль', 'module.exports предоставляет значение модуля', 'CommonJS использует только import maps', 'Каждый вызов require запускает новый процесс')),
  ('Why use streams for large files?', 'Зачем использовать потоки для больших файлов?', jsonb_build_array('Они обрабатывают данные частями, не загружая всё сразу', 'Они делают все операции синхронными', 'Они автоматически сжимают каждый файл', 'Они хранят данные только в браузере')),
  ('What is the Buffer class used for?', 'Для чего нужен класс Buffer?', jsonb_build_array('Для работы с двоичными данными', 'Для оформления вывода в терминале', 'Для управления историей браузера', 'Для объявления интерфейсов TypeScript')),
  ('What does backpressure help control in a stream?', 'Какую проблему помогает контролировать backpressure в потоке?', jsonb_build_array('Слишком быстрый производитель данных перегружает медленного потребителя', 'Порядок CSS-правил', 'Количество HTTP-заголовков', 'Размер стека вызовов JavaScript')),
  ('Which statements about the Node.js event loop are correct?', 'Какие утверждения о цикле событий Node.js верны?', jsonb_build_array('Долгий синхронный обработчик блокирует цикл событий', 'Некоторые операции файловой системы используют пул потоков libuv', 'Обработчики JavaScript по умолчанию параллельно выполняются в нескольких потоках', 'setTimeout гарантирует точное время запуска')),
  ('Why should secrets be read from environment configuration?', 'Почему секреты следует передавать через переменные окружения?', jsonb_build_array('Чтобы не хранить секреты конкретного окружения в исходниках', 'Чтобы сделать секреты доступными каждому браузеру', 'Чтобы не проверять настройки', 'Чтобы автоматически зашифровать базу данных')),

  ('What does the doctype declaration do in an HTML document?', 'Для чего в HTML-документе нужна декларация doctype?', jsonb_build_array('Просит браузер включить режим стандартов', 'Подключает таблицу стилей', 'Создаёт заголовок', 'Объявляет переменную JavaScript')),
  ('What is the purpose of the alt attribute on an image?', 'Для чего нужен атрибут alt у изображения?', jsonb_build_array('Задаёт текстовую альтернативу изображению', 'Устанавливает ширину изображения', 'Загружает изображение с более высоким разрешением', 'Автоматически добавляет ссылку')),
  ('Which element represents the main content of a page?', 'Какой HTML-элемент обозначает основное содержимое страницы?', jsonb_build_array('main', 'aside', 'title', 'meta')),
  ('How should a label be associated with an input?', 'Как связать подпись label с полем ввода?', jsonb_build_array('Указать в for подписи значение id поля', 'Указать в href подписи класс поля', 'Поместить подпись внутрь input', 'Указать текст подписи в alt поля')),
  ('Which statements about buttons inside forms are correct?', 'Какие утверждения о кнопках внутри формы верны?', jsonb_build_array('Кнопка с type submit отправляет форму', 'Кнопка с type button не отправляет форму по умолчанию', 'Каждая кнопка всегда отправляет все формы страницы', 'Элемент button не может содержать текст')),
  ('What is the purpose of the lang attribute on html?', 'Для чего нужен атрибут lang у html?', jsonb_build_array('Указывает основной язык документа', 'Задаёт направление каждой CSS-анимации', 'Автоматически загружает файлы перевода', 'Изменяет URL страницы')),
  ('Which element groups related form controls with a caption?', 'Какие элементы объединяют связанные поля формы с подписью группы?', jsonb_build_array('fieldset и legend', 'section и summary', 'label и output', 'form и caption')),
  ('Why use semantic HTML elements?', 'Зачем использовать семантические HTML-элементы?', jsonb_build_array('Они сообщают структуру и назначение документа браузерам и вспомогательным технологиям', 'Они автоматически полностью оформляют страницу', 'Они запрещают запуск JavaScript', 'Они заменяют HTTP-запросы')),
  ('Which statements about buttons and links are correct?', 'Какие утверждения о кнопках и ссылках верны?', jsonb_build_array('Ссылка выполняет переход к ресурсу', 'Кнопка запускает действие', 'Ссылка всегда подходит для отправки формы', 'Кнопке обязательно нужен href')),
  ('What does the defer attribute do on a classic external script?', 'Что делает атрибут defer у обычного внешнего скрипта?', jsonb_build_array('Откладывает выполнение до разбора документа и сохраняет порядок скриптов', 'Запускает скрипт до начала разбора HTML', 'Запрещает загружать скрипт', 'Перемещает скрипт в web worker')),

  ('What does CSS control?', 'За что отвечает CSS?', jsonb_build_array('За внешний вид и расположение содержимого документа', 'За схему базы данных сервера', 'За версию среды JavaScript', 'За доменное имя сайта')),
  ('What does the universal box-sizing value border-box change?', 'Что меняет box-sizing: border-box?', jsonb_build_array('Ширина включает содержимое, внутренние отступы и границу', 'В ширину включаются внешние отступы', 'Элемент становится grid-контейнером', 'Элемент больше не может выходить за границы')),
  ('Which selector targets an element with class card?', 'Какой селектор выбирает элемент с классом card?', jsonb_build_array('.card', '#card', 'card()', '@card')),
  ('What is CSS specificity used for?', 'Для чего нужна специфичность CSS?', jsonb_build_array('Чтобы определить, какое из конфликтующих правил применится', 'Чтобы выбрать язык HTML-документа', 'Чтобы рассчитать разрешение изображения', 'Чтобы упорядочить сетевые запросы')),
  ('Which statements about Flexbox are correct?', 'Какие утверждения о Flexbox верны?', jsonb_build_array('Элементы располагаются вдоль главной оси', 'align-items выравнивает элементы по поперечной оси', 'Каждому дочернему элементу обязательно нужен position: absolute', 'Flexbox работает только с текстовыми узлами')),
  ('What is a CSS media query commonly used for?', 'Для чего обычно используют media query в CSS?', jsonb_build_array('Для применения стилей при заданных условиях устройства или области просмотра', 'Для загрузки медиафайла в базу данных', 'Для изменения языка HTML', 'Для объявления модуля JavaScript')),
  ('What does position relative do?', 'Как работает position: relative?', jsonb_build_array('Элемент остаётся в обычном потоке, но его можно смещать относительно исходного места', 'Элемент удаляется из документа', 'Элемент закрепляется относительно окна браузера', 'Элемент становится grid-контейнером')),
  ('Which statements about CSS Grid are correct?', 'Какие утверждения о CSS Grid верны?', jsonb_build_array('Сетка поддерживает строки и столбцы', 'grid-template-columns задаёт столбцы сетки', 'В сетке может находиться только один элемент', 'Для размещения каждой ячейки обязательно нужен JavaScript')),
  ('What does inherit do for a CSS property?', 'Что делает значение inherit для CSS-свойства?', jsonb_build_array('Наследует вычисленное значение родительского элемента', 'Сбрасывает свойство к начальному значению браузера', 'Копирует значение соседнего элемента', 'Повышает специфичность правила')),
  ('What is the main effect of transform translate on an element?', 'Как обычно действует transform: translate на элемент?', jsonb_build_array('Визуально перемещает элемент, не меняя его место в обычном потоке документа', 'Меняет семантическую роль HTML', 'Дважды добавляет элемент в дерево доступности', 'Переставляет элемент в DOM')),

  ('What does SELECT do?', 'Что делает команда SELECT?', jsonb_build_array('Читает строки из таблицы или результата запроса', 'Удаляет сервер базы данных', 'Создаёт CSS-класс', 'Запускает сетевой обработчик')),
  ('What does a primary key identify?', 'Что идентифицирует первичный ключ?', jsonb_build_array('Строку, уникальную в пределах таблицы', 'Пароль базы данных', 'Порт сервера', 'Только порядок сортировки столбца')),
  ('Which clause filters rows before grouping?', 'Какое выражение фильтрует строки до группировки?', jsonb_build_array('WHERE', 'HAVING', 'ORDER BY', 'VALUES')),
  ('What does an INNER JOIN return?', 'Что возвращает INNER JOIN?', jsonb_build_array('Строки, для которых условие соединения совпало в обеих таблицах', 'Все возможные комбинации строк', 'Только строки со значением NULL', 'Только строки левой таблицы')),
  ('Which statements about foreign keys are correct?', 'Какие утверждения о внешних ключах верны?', jsonb_build_array('Они могут проверять ссылки между таблицами', 'Они могут запрещать удаление строки, на которую ссылаются', 'Они автоматически шифруют связанные значения', 'Они гарантируют, что каждый запрос использует индекс')),
  ('What does GROUP BY do?', 'Что делает GROUP BY?', jsonb_build_array('Группирует строки для вычисления агрегатных значений по каждой группе', 'По умолчанию сортирует все строки по алфавиту', 'Объединяет две базы данных', 'Удаляет все повторяющиеся таблицы')),
  ('How is NULL tested in SQL?', 'Как в SQL проверяют значение NULL?', jsonb_build_array('IS NULL', '= NULL', '== empty', 'IN NULL')),
  ('Which statements about database transactions are correct?', 'Какие утверждения о транзакциях верны?', jsonb_build_array('COMMIT сохраняет изменения транзакции', 'ROLLBACK может отменить ещё не зафиксированные изменения', 'Транзакция всегда охватывает все серверы баз данных', 'SELECT нельзя выполнять внутри транзакции')),
  ('What is a common purpose of an index?', 'Для чего обычно нужен индекс базы данных?', jsonb_build_array('Ускоряет подходящие запросы ценой дополнительного места и работы при изменениях', 'Гарантирует, что каждый запрос выполнится за постоянное время', 'Заменяет необходимость в ограничениях целостности', 'Шифрует данные таблицы')),
  ('Why use parameterized SQL queries?', 'Зачем использовать параметризованные SQL-запросы?', jsonb_build_array('Чтобы отделить значения от синтаксиса запроса и снизить риск SQL-инъекции', 'Чтобы каждый запрос выполнялся асинхронно', 'Чтобы отключить права доступа к базе', 'Чтобы не задавать типы столбцов')),

  ('What does git status show?', 'Что показывает git status?', jsonb_build_array('Текущую ветку и изменения в рабочей копии', 'Состояние оборудования удалённого сервера', 'Содержимое всех удалённых репозиториев', 'Список установленных пакетов Node.js')),
  ('What is a Git commit?', 'Что такое коммит Git?', jsonb_build_array('Зафиксированный снимок изменений репозитория', 'Временное сетевое соединение', 'Папка, которую Git игнорирует', 'Имя удалённой ветки после удаления')),
  ('What does git branch create?', 'Что создаёт git branch?', jsonb_build_array('Имя-ссылку на линию разработки', 'Копию операционной системы', 'Удалённую базу данных', 'Реестр пакетов')),
  ('What does git fetch do?', 'Что делает git fetch?', jsonb_build_array('Загружает сведения об изменениях на сервере, но не объединяет их с текущей веткой', 'Удаляет все удалённые ветки', 'Добавляет в индекс все локальные файлы', 'Автоматически публикует локальные коммиты')),
  ('Which statements about merge conflicts are correct?', 'Какие утверждения о конфликтах слияния верны?', jsonb_build_array('Они возникают, когда Git не может автоматически объединить изменения', 'Иногда нужно вручную исправить файл и отметить конфликт решённым', 'Они всегда уничтожают репозиторий', 'Они бывают только в бинарных файлах')),
  ('What does git stash do?', 'Что делает git stash?', jsonb_build_array('Временно сохраняет незакоммиченные изменения', 'Навсегда удаляет текущую ветку', 'Загружает все файлы в реестр пакетов', 'Переписывает историю удалённого репозитория')),
  ('What is .gitignore used for?', 'Для чего нужен файл .gitignore?', jsonb_build_array('Чтобы перечислить неотслеживаемые файлы, которые Git обычно должен игнорировать', 'Чтобы удалить файлы из всех копий репозитория', 'Чтобы зашифровать историю репозитория', 'Чтобы переименовать основную ветку')),
  ('What does git rebase do?', 'Что делает git rebase?', jsonb_build_array('Повторно применяет коммиты поверх другой базовой точки', 'Объединяет все ветки без изменения истории', 'Восстанавливает удалённые системные файлы', 'Копирует настройки Git на другой компьютер')),
  ('Which statements about reset and revert are correct?', 'Какие утверждения о git reset и git revert верны?', jsonb_build_array('revert создаёт коммит, отменяющий прежние изменения', 'reset может передвинуть ссылку ветки на другой коммит', 'Обе команды всегда одинаково сохраняют общую историю', 'revert навсегда удаляет репозиторий')),
  ('Why avoid rebasing commits that others have already based work on?', 'Почему не стоит перебазировать коммиты, на которых уже основана чужая работа?', jsonb_build_array('Rebase переписывает идентификаторы коммитов и может нарушить общую историю', 'Rebase удаляет содержимое всех файлов', 'Git запрещает отправлять любую перебазированную ветку', 'Команда меняет язык программирования проекта'));

WITH option_positions AS (
  SELECT question.id AS question_id,
         question.text AS old_question_text,
         option.id AS option_id,
         (ROW_NUMBER() OVER (PARTITION BY question.id ORDER BY option.id) - 1)::INTEGER AS option_index
  FROM questions AS question
  JOIN question_options AS option ON option.question_id = question.id
)
UPDATE question_options AS option
SET text = translation.option_texts ->> option_positions.option_index
FROM option_positions
JOIN question_text_translations AS translation
  ON translation.old_text = option_positions.old_question_text
WHERE option.id = option_positions.option_id;

UPDATE questions AS question
SET text = translation.new_text,
    updated_at = NOW()
FROM question_text_translations AS translation
WHERE question.text = translation.old_text;

UPDATE skills SET description = CASE name
  WHEN 'JavaScript' THEN 'Практика языка программирования для веб-разработки.'
  WHEN 'TypeScript' THEN 'JavaScript с проверкой типов и расширенными средствами разработки.'
  WHEN 'React' THEN 'Библиотека для создания интерфейсов из компонентов.'
  WHEN 'Node.js' THEN 'Среда выполнения JavaScript для серверных приложений.'
  WHEN 'HTML' THEN 'Язык разметки структуры веб-страниц.'
  WHEN 'CSS' THEN 'Язык стилей для оформления веб-страниц.'
  WHEN 'SQL' THEN 'Язык запросов к реляционным базам данных.'
  WHEN 'Git' THEN 'Распределённая система контроля версий.'
  ELSE description
END
WHERE name IN ('JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git');

WITH seed (text, question_type, difficulty, options) AS (
  VALUES
    ('Когда возникает событие DOMContentLoaded?', 'SINGLE_CHOICE', 'EASY', '[{"text":"Когда HTML разобран и DOM построен","is_correct":true},{"text":"Когда загрузились все изображения и видео","is_correct":false},{"text":"Только после закрытия вкладки","is_correct":false},{"text":"Когда завершился каждый сетевой запрос страницы","is_correct":false}]'::jsonb),
    ('Что возвращает document.querySelectorAll?', 'SINGLE_CHOICE', 'EASY', '[{"text":"Статический NodeList подходящих элементов","is_correct":true},{"text":"Живую коллекцию, которая всегда меняется вместе с DOM","is_correct":false},{"text":"Первый подходящий элемент или null","is_correct":false},{"text":"Массив строк с HTML-разметкой","is_correct":false}]'::jsonb),
    ('Для чего вызывают event.preventDefault()?', 'SINGLE_CHOICE', 'EASY', '[{"text":"Чтобы отменить стандартное действие браузера для события","is_correct":true},{"text":"Чтобы удалить обработчик события","is_correct":false},{"text":"Чтобы остановить распространение события по DOM","is_correct":false},{"text":"Чтобы перезагрузить текущую страницу","is_correct":false}]'::jsonb),
    ('Что происходит при всплытии события в DOM?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Событие распространяется от целевого элемента к его предкам","is_correct":true},{"text":"Событие передаётся только соседним элементам","is_correct":false},{"text":"Событие сразу удаляется из очереди","is_correct":false},{"text":"Браузер копирует целевой элемент","is_correct":false}]'::jsonb),
    ('Как работает делегирование событий?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Обработчик на общем предке проверяет event.target для дочерних элементов","is_correct":true},{"text":"Для каждого дочернего элемента создаётся отдельный таймер","is_correct":false},{"text":"События сохраняются в localStorage","is_correct":false},{"text":"Браузер автоматически заменяет все обработчики одним","is_correct":false}]'::jsonb),
    ('Для чего используют MutationObserver?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Чтобы получать уведомления об изменениях DOM","is_correct":true},{"text":"Чтобы наблюдать за изменением сетевого адреса сервера","is_correct":false},{"text":"Чтобы измерять время выполнения Promise","is_correct":false},{"text":"Чтобы автоматически отменять события мыши","is_correct":false}]'::jsonb),
    ('Какие утверждения о Promise.all верны?', 'MULTIPLE_CHOICE', 'MEDIUM', '[{"text":"Promise.all выполняется успешно, когда выполнены все переданные Promise","is_correct":true},{"text":"Если один Promise отклонён, Promise.all отклоняется с этой причиной","is_correct":true},{"text":"Promise.all всегда дожидается завершения каждого Promise после отказа","is_correct":false},{"text":"Promise.all запускает операции параллельно сам по себе","is_correct":false}]'::jsonb),
    ('Что возвращает Promise.allSettled?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Promise со статусом и результатом каждого входного Promise","is_correct":true},{"text":"Первое успешно завершившееся значение","is_correct":false},{"text":"Только причины отклонения Promise","is_correct":false},{"text":"Синхронный массив исходных функций","is_correct":false}]'::jsonb),
    ('Что возвращает вызов then у Promise?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Новый Promise, связанный с результатом обработчика","is_correct":true},{"text":"Исходное значение Promise без изменений","is_correct":false},{"text":"Всегда undefined","is_correct":false},{"text":"Синхронно распакованное значение результата","is_correct":false}]'::jsonb),
    ('Что гарантирует ключевое слово async для функции?', 'SINGLE_CHOICE', 'EASY', '[{"text":"Функция всегда возвращает Promise","is_correct":true},{"text":"Функция выполняется в отдельном потоке","is_correct":false},{"text":"Функция никогда не может выбросить ошибку","is_correct":false},{"text":"Все вызовы функции автоматически выполняются последовательно","is_correct":false}]'::jsonb),
    ('Что происходит при await внутри async-функции?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Продолжение этой функции ждёт результат Promise, основной поток при этом не блокируется","is_correct":true},{"text":"Весь JavaScript в браузере останавливается до завершения Promise","is_correct":false},{"text":"Promise немедленно превращается в обычный объект","is_correct":false},{"text":"Функция автоматически запускается в web worker","is_correct":false}]'::jsonb),
    ('Как event loop выполняет синхронный код, обработчик Promise и setTimeout с задержкой 0?', 'SINGLE_CHOICE', 'HARD', '[{"text":"Сначала синхронный код, затем микрозадача Promise, затем задача таймера","is_correct":true},{"text":"Сначала таймер, затем синхронный код, затем Promise","is_correct":false},{"text":"Все три части выполняются одновременно","is_correct":false},{"text":"Сначала Promise, затем таймер, затем синхронный код","is_correct":false}]'::jsonb),
    ('Что происходит, если fetch получает HTTP-ответ со статусом 404?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Promise обычно выполняется успешно и возвращает Response с response.ok равным false","is_correct":true},{"text":"Promise всегда автоматически отклоняется для любого статуса 4xx","is_correct":false},{"text":"Браузер повторяет запрос бесконечно","is_correct":false},{"text":"Ответ преобразуется в статус 200","is_correct":false}]'::jsonb),
    ('Для чего используют AbortController при сетевом запросе?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Чтобы передать сигнал отмены операции, например fetch","is_correct":true},{"text":"Чтобы автоматически повторять запрос после ошибки","is_correct":false},{"text":"Чтобы преобразовать ответ в JSON","is_correct":false},{"text":"Чтобы отключить проверку CORS","is_correct":false}]'::jsonb),
    ('Когда выполняется обработчик finally у Promise?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"После выполнения или отклонения Promise","is_correct":true},{"text":"Только если Promise выполнен успешно","is_correct":false},{"text":"До запуска обработчиков then и catch","is_correct":false},{"text":"Только если страница закрывается","is_correct":false}]'::jsonb),
    ('Что делает Promise.race?', 'SINGLE_CHOICE', 'HARD', '[{"text":"Завершается по результату первого завершившегося входного Promise","is_correct":true},{"text":"Ждёт успешного выполнения всех Promise","is_correct":false},{"text":"Возвращает массив результатов в исходном порядке","is_correct":false},{"text":"Отменяет все Promise, кроме самого быстрого","is_correct":false}]'::jsonb),
    ('Как обработать отклонение Promise через async/await?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Поместить await внутри try и обработать ошибку в catch","is_correct":true},{"text":"Добавить finally к функции без try","is_correct":false},{"text":"Вызвать JSON.parse для Promise","is_correct":false},{"text":"Использовать только setTimeout","is_correct":false}]'::jsonb),
    ('Почему textContent безопаснее innerHTML для вставки обычного пользовательского текста?', 'SINGLE_CHOICE', 'HARD', '[{"text":"textContent вставляет содержимое как текст, не разбирая его как HTML","is_correct":true},{"text":"textContent автоматически шифрует текст","is_correct":false},{"text":"innerHTML всегда удаляет HTML-теги","is_correct":false},{"text":"Они оба выполняют вставленную строку как JavaScript","is_correct":false}]'::jsonb),
    ('Что нужно сохранить, чтобы позднее удалить обработчик через removeEventListener?', 'SINGLE_CHOICE', 'MEDIUM', '[{"text":"Ссылку на ту же функцию-обработчик и совместимые параметры","is_correct":true},{"text":"Только текст события, например click","is_correct":false},{"text":"Только результат вызова addEventListener","is_correct":false},{"text":"Идентификатор DOM-элемента в localStorage","is_correct":false}]'::jsonb),
    ('Какие утверждения о Promise и микрозадачах верны?', 'MULTIPLE_CHOICE', 'HARD', '[{"text":"Функция-исполнитель нового Promise вызывается синхронно","is_correct":true},{"text":"Обработчик then ставится в очередь микрозадач","is_correct":true},{"text":"Все обработчики Promise выполняются до завершения текущего синхронного кода","is_correct":false},{"text":"Каждый Promise создаёт отдельный поток ОС","is_correct":false}]'::jsonb)
), inserted_questions AS (
  INSERT INTO questions (skill_id, text, type, difficulty)
  SELECT skill.id, seed.text, seed.question_type, seed.difficulty
  FROM seed
  JOIN skills AS skill ON skill.name = 'JavaScript' AND skill.is_active = TRUE
  WHERE jsonb_array_length(seed.options) = 4
    AND EXISTS (
      SELECT 1 FROM jsonb_to_recordset(seed.options) AS option(text TEXT, is_correct BOOLEAN)
      WHERE option.is_correct = TRUE
    )
  RETURNING id, skill_id, text
)
INSERT INTO question_options (question_id, text, is_correct)
SELECT question.id, option.text, option.is_correct
FROM inserted_questions AS question
JOIN seed ON seed.text = question.text
CROSS JOIN LATERAL jsonb_to_recordset(seed.options) AS option(text TEXT, is_correct BOOLEAN);

DROP TABLE question_text_translations;
