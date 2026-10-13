CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  track VARCHAR(20) NOT NULL,
  level VARCHAR(20) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  prompt TEXT NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_interview_questions_track_level_position
    UNIQUE (track, level, position)
);

INSERT INTO interview_questions (track, level, topic, prompt, position)
VALUES
  ('Frontend', 'Junior', 'JavaScript', 'В чём разница между let, const и var?', 1),
  ('Frontend', 'Junior', 'Асинхронность', 'Что такое Promise и для чего он нужен?', 2),
  ('Frontend', 'Junior', 'React', 'Зачем React нужен атрибут key при выводе списков?', 3),
  ('Frontend', 'Junior+', 'JavaScript', 'Что такое замыкание и где оно может пригодиться?', 1),
  ('Frontend', 'Junior+', 'Асинхронность', 'Чем Promise.all отличается от Promise.allSettled?', 2),
  ('Frontend', 'Junior+', 'React', 'Чем управляемый компонент отличается от неуправляемого?', 3),
  ('Frontend', 'Middle', 'JavaScript', 'В каком порядке выполнятся microtask и macrotask в event loop?', 1),
  ('Frontend', 'Middle', 'React', 'Когда React.memo, useMemo и useCallback помогают, а когда мешают?', 2),
  ('Frontend', 'Middle', 'Браузер', 'Что вызывает reflow и как уменьшить его влияние на страницу?', 3),

  ('Backend', 'Junior', 'HTTP и API', 'Чем отличаются методы GET, POST, PUT и PATCH?', 1),
  ('Backend', 'Junior', 'Базы данных', 'Что такое индекс в базе данных и для чего он нужен?', 2),
  ('Backend', 'Junior', 'Безопасность', 'Чем аутентификация отличается от авторизации?', 3),
  ('Backend', 'Junior+', 'HTTP и API', 'Что означает идемпотентность HTTP-запроса?', 1),
  ('Backend', 'Junior+', 'Базы данных', 'Для чего нужны транзакции и что означает ACID?', 2),
  ('Backend', 'Junior+', 'Безопасность', 'Почему пароли хранят через хеширование с солью?', 3),
  ('Backend', 'Middle', 'Базы данных', 'Как уровни изоляции транзакций влияют на конкурентные запросы?', 1),
  ('Backend', 'Middle', 'HTTP и API', 'Как выбрать стратегию пагинации для большого набора данных?', 2),
  ('Backend', 'Middle', 'Безопасность', 'Как ограничение частоты запросов защищает публичный API?', 3),

  ('Fullstack', 'Junior', 'Клиент и сервер', 'Как запрос проходит от браузера до сервера и возвращается в интерфейс?', 1),
  ('Fullstack', 'Junior', 'HTTP и API', 'Что такое CORS и когда браузер применяет эту политику?', 2),
  ('Fullstack', 'Junior', 'Архитектура', 'Какие задачи выполняют frontend, backend и база данных?', 3),
  ('Fullstack', 'Junior+', 'Frontend', 'Как выбрать, где хранить состояние интерфейса?', 1),
  ('Fullstack', 'Junior+', 'REST API', 'Какие коды ответа вернёт API при создании и ошибке валидации?', 2),
  ('Fullstack', 'Junior+', 'Безопасность', 'Как параметризованные запросы помогают защититься от SQL-инъекций?', 3),
  ('Fullstack', 'Middle', 'Архитектура', 'Как согласовать кеширование между браузером, API и базой данных?', 1),
  ('Fullstack', 'Middle', 'Надёжность', 'Как спроектировать обработку повторных запросов без дублирования операций?', 2),
  ('Fullstack', 'Middle', 'Эксплуатация', 'Какие метрики и логи помогут найти медленный путь запроса?', 3)
ON CONFLICT (track, level, position) DO NOTHING;
