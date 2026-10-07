-- Original Russian multiple-choice questions based on topic coverage in the
-- MIT-licensed Front End Interview Handbook (see README attribution).
WITH seed(text, difficulty, correct_option, options) AS (
  VALUES
    ('Какой метод возвращает первый элемент, подходящий под CSS-селектор?', 'EASY', 1, ARRAY['document.querySelector()', 'document.getElementsByClassName()', 'document.createTextNode()', 'document.matches()']::TEXT[]),
    ('Какое свойство события содержит элемент, на котором обработчик был зарегистрирован?', 'EASY', 2, ARRAY['event.target', 'event.currentTarget', 'event.source', 'event.node']::TEXT[]),
    ('Что делает preventDefault() у события формы?', 'EASY', 3, ARRAY['Удаляет форму из DOM', 'Останавливает всплытие события', 'Отменяет стандартное действие браузера', 'Очищает поля формы']::TEXT[]),
    ('Что обычно возвращает querySelectorAll()?', 'EASY', 4, ARRAY['Живую HTMLCollection', 'Один HTMLElement', 'Массив с автоматическим обновлением', 'Статический NodeList']::TEXT[]),
    ('Как получить значение текстового поля с id="email"?', 'EASY', 1, ARRAY['document.querySelector("#email").value', 'document.querySelector("#email").text', 'document.value("#email")', 'document.getText("email")']::TEXT[]),
    ('Какой атрибут HTML связывает label с полем ввода?', 'EASY', 2, ARRAY['name', 'for', 'role', 'target']::TEXT[]),
    ('Какое утверждение о всплытии события верно?', 'EASY', 3, ARRAY['Оно работает только для клавиатуры', 'Оно переносит событие из документа в браузер', 'Событие проходит от вложенного элемента к его предкам', 'Оно отключено для всех событий по умолчанию']::TEXT[]),
    ('Как безопаснее вставить обычный текст пользователя в элемент?', 'EASY', 4, ARRAY['Через innerHTML без преобразований', 'Через document.write()', 'Собрав HTML-строку и присвоив outerHTML', 'Через textContent']::TEXT[]),
    ('Зачем делегировать обработчик клика родительскому элементу списка?', 'MEDIUM', 1, ARRAY['Чтобы обрабатывать клики по текущим и добавленным позже дочерним элементам', 'Чтобы каждый дочерний элемент получил отдельную копию данных', 'Чтобы отменить всплытие событий', 'Чтобы браузер автоматически сортировал список']::TEXT[]),
    ('Что вернёт уже полученный ранее NodeList из querySelectorAll(), если позже добавить подходящий элемент?', 'MEDIUM', 2, ARRAY['Он немедленно станет живой коллекцией', 'Он останется прежним: NodeList из querySelectorAll статический', 'Он превратится в HTMLCollection', 'Он вызовет MutationObserver']::TEXT[]),
    ('Для чего применяют MutationObserver?', 'MEDIUM', 3, ARRAY['Для перехвата сетевых запросов', 'Для измерения времени анимации', 'Для наблюдения за изменениями DOM-дерева', 'Для отмены событий формы']::TEXT[]),
    ('В каком порядке обычно вызываются обработчики при всплытии click?', 'MEDIUM', 4, ARRAY['Сначала document, затем цель', 'В случайном порядке', 'Только обработчик цели', 'От цели события к предкам']::TEXT[]),
    ('Как прочитать data-user-id у элемента element?', 'MEDIUM', 1, ARRAY['element.dataset.userId', 'element.data-user-id', 'element.attributes.dataset.userId', 'element.userId']::TEXT[]),
    ('Какой метод отменяет дальнейшее распространение события к предкам?', 'MEDIUM', 2, ARRAY['preventDefault()', 'stopPropagation()', 'cancelDefault()', 'stopImmediateDefault()']::TEXT[]),
    ('Что нужно проверить после fetch(), чтобы обработать HTTP-ответ со статусом 404 как ошибку?', 'MEDIUM', 3, ARRAY['fetch всегда отклоняет Promise при статусе 404', 'Нужно проверять response.statusText === "OK"', 'Нужно проверить response.ok и при false выбросить ошибку', 'Нужно вызвать response.reject()']::TEXT[]),
    ('Что произойдёт с Promise.all(), если один из переданных Promise отклонится?', 'MEDIUM', 4, ARRAY['Он дождётся остальных и вернёт массив результатов', 'Он проигнорирует отклонение', 'Он преобразует ошибку в null', 'Возвращённый Promise отклонится с первой ошибкой']::TEXT[]),
    ('Как отменить fetch-запрос через AbortController?', 'HARD', 1, ARRAY['Передать controller.signal в fetch и вызвать controller.abort()', 'Вызвать fetch.cancel() после получения ответа', 'Установить response.cancelled = true', 'Передать AbortController вторым аргументом в response.json()']::TEXT[]),
    ('Что произойдёт при исключении внутри async-функции, если исключение не перехвачено?', 'HARD', 2, ARRAY['Функция вернёт undefined и продолжится', 'Возвращённый Promise будет отклонён этой ошибкой', 'Браузер автоматически повторит функцию', 'Ошибка станет синхронной для вызвавшего кода']::TEXT[]),
    ('Какой порядок вывода у кода: console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4)?', 'HARD', 3, ARRAY['1, 2, 3, 4', '1, 3, 2, 4', '1, 4, 2, 3', '1, 4, 3, 2']::TEXT[]),
    ('Какое утверждение о Promise executor верно?', 'HARD', 4, ARRAY['Он всегда запускается в следующей задаче event loop', 'Он выполняется только после вызова then()', 'Он запускается в микрозадаче', 'Он вызывается синхронно при создании Promise']::TEXT[]),
    ('Чем Promise.allSettled() отличается от Promise.all()?', 'HARD', 1, ARRAY['Он ждёт завершения всех Promise и сообщает статус каждого, даже если некоторые отклонены', 'Он завершается сразу после первого fulfilled', 'Он отклоняется при любом отклонении входного Promise', 'Он принимает только уже завершённые Promise']::TEXT[]),
    ('Что делает Promise.race()?', 'HARD', 2, ARRAY['Возвращает результаты всех Promise в исходном порядке', 'Завершается результатом первого завершившегося Promise, fulfilled или rejected', 'Ждёт только первый fulfilled, игнорируя отклонения', 'Отменяет все Promise, кроме самого быстрого']::TEXT[]),
    ('Что вернёт Promise.any(), если все входные Promise отклонены?', 'HARD', 3, ARRAY['Первую ошибку без обёртки', 'Массив причин отклонения', 'Отклонённый AggregateError', 'Успешный Promise со значением undefined']::TEXT[]),
    ('Почему await внутри обычного map(callback) не заставляет Promise.all дождаться результатов?', 'HARD', 4, ARRAY['Потому что map синхронный и запрещает Promise', 'Потому что await применим только к fetch', 'Потому что callback в map не может быть async', 'map вернёт массив Promise; чтобы дождаться всех, обычно используют await Promise.all(array.map(async ...))']::TEXT[])
), inserted_questions AS (
  INSERT INTO questions (skill_id, text, type, difficulty, is_active)
  SELECT skill.id, seed.text, 'SINGLE_CHOICE', seed.difficulty, TRUE
  FROM seed
  JOIN skills AS skill ON skill.name = 'JavaScript' AND skill.is_active = TRUE
  RETURNING id, text
)
INSERT INTO question_options (question_id, text, is_correct)
SELECT question.id, option.text, option.ordinality = seed.correct_option
FROM inserted_questions AS question
JOIN seed ON seed.text = question.text
CROSS JOIN LATERAL UNNEST(seed.options) WITH ORDINALITY AS option(text, ordinality);
