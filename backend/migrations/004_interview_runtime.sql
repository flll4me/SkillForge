ALTER TABLE interviews
  ADD COLUMN current_difficulty VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
    CHECK (current_difficulty IN ('EASY', 'MEDIUM', 'HARD'));

ALTER TABLE user_answers
  ADD COLUMN score SMALLINT NOT NULL DEFAULT 0 CHECK (score IN (0, 100)),
  ADD COLUMN is_correct BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO questions (skill_id, text, type, difficulty)
SELECT skill.id, seed.text, seed.question_type, seed.difficulty
FROM skills AS skill
CROSS JOIN (VALUES
  ('What is the difference between let, const, and var?', 'MULTIPLE_CHOICE', 'EASY'),
  ('Which of these values is a primitive in JavaScript?', 'SINGLE_CHOICE', 'EASY'),
  ('What does Array.prototype.map return?', 'SINGLE_CHOICE', 'EASY'),
  ('What is a closure?', 'SINGLE_CHOICE', 'MEDIUM'),
  ('Which statements about the event loop are correct?', 'MULTIPLE_CHOICE', 'MEDIUM'),
  ('What does async/await do with a Promise?', 'SINGLE_CHOICE', 'MEDIUM'),
  ('How does the prototype chain work?', 'SINGLE_CHOICE', 'HARD'),
  ('Which statements about JavaScript this are correct?', 'MULTIPLE_CHOICE', 'HARD'),
  ('Why is immutable state useful in UI applications?', 'SINGLE_CHOICE', 'MEDIUM'),
  ('What happens when a let variable is accessed before initialization?', 'SINGLE_CHOICE', 'HARD')
) AS seed(text, question_type, difficulty)
WHERE skill.name = 'JavaScript';

INSERT INTO question_options (question_id, text, is_correct)
SELECT question.id, seed.option_text, seed.is_correct
FROM questions AS question
JOIN skills AS skill ON skill.id = question.skill_id
JOIN (VALUES
  ('What is the difference between let, const, and var?', 'A const binding cannot be reassigned', TRUE),
  ('What is the difference between let, const, and var?', 'var is function-scoped', TRUE),
  ('What is the difference between let, const, and var?', 'let is always global', FALSE),
  ('What is the difference between let, const, and var?', 'const makes object contents deeply immutable', FALSE),

  ('Which of these values is a primitive in JavaScript?', '42', TRUE),
  ('Which of these values is a primitive in JavaScript?', 'A function', FALSE),
  ('Which of these values is a primitive in JavaScript?', 'An array', FALSE),
  ('Which of these values is a primitive in JavaScript?', 'A Date instance', FALSE),

  ('What does Array.prototype.map return?', 'A new array with each element transformed by the callback', TRUE),
  ('What does Array.prototype.map return?', 'The first matching element', FALSE),
  ('What does Array.prototype.map return?', 'The original array sorted in place', FALSE),
  ('What does Array.prototype.map return?', 'A boolean', FALSE),

  ('What is a closure?', 'A function together with access to its lexical outer scope', TRUE),
  ('What is a closure?', 'A function that can only run once', FALSE),
  ('What is a closure?', 'A block that automatically catches errors', FALSE),
  ('What is a closure?', 'A special kind of Promise', FALSE),

  ('Which statements about the event loop are correct?', 'Promise callbacks run as microtasks', TRUE),
  ('Which statements about the event loop are correct?', 'A long synchronous task blocks the main thread', TRUE),
  ('Which statements about the event loop are correct?', 'All timers run before queued microtasks', FALSE),
  ('Which statements about the event loop are correct?', 'JavaScript callbacks always run in parallel', FALSE),

  ('What does async/await do with a Promise?', 'await pauses the async function until the Promise settles', TRUE),
  ('What does async/await do with a Promise?', 'It turns every Promise rejection into a successful value', FALSE),
  ('What does async/await do with a Promise?', 'It blocks the browser main thread', FALSE),
  ('What does async/await do with a Promise?', 'It removes the need to handle errors', FALSE),

  ('How does the prototype chain work?', 'Property lookup continues through linked prototypes until found or exhausted', TRUE),
  ('How does the prototype chain work?', 'Every object copies all inherited properties at creation', FALSE),
  ('How does the prototype chain work?', 'Only arrays can have prototypes', FALSE),
  ('How does the prototype chain work?', 'It is the same thing as the call stack', FALSE),

  ('Which statements about JavaScript this are correct?', 'An arrow function captures this from its surrounding scope', TRUE),
  ('Which statements about JavaScript this are correct?', 'A method call usually sets this to the object before the dot', TRUE),
  ('Which statements about JavaScript this are correct?', 'this always refers to the function where it was written', FALSE),
  ('Which statements about JavaScript this are correct?', 'bind changes the original function in place', FALSE),

  ('Why is immutable state useful in UI applications?', 'A new reference makes state changes easier to detect', TRUE),
  ('Why is immutable state useful in UI applications?', 'It prevents every object from being collected by garbage collection', FALSE),
  ('Why is immutable state useful in UI applications?', 'It makes network requests synchronous', FALSE),
  ('Why is immutable state useful in UI applications?', 'It guarantees that state can never contain invalid data', FALSE),

  ('What happens when a let variable is accessed before initialization?', 'A ReferenceError is thrown during the temporal dead zone', TRUE),
  ('What happens when a let variable is accessed before initialization?', 'It evaluates to null', FALSE),
  ('What happens when a let variable is accessed before initialization?', 'It creates a global variable', FALSE),
  ('What happens when a let variable is accessed before initialization?', 'The declaration is silently moved before the script', FALSE)
) AS seed(question_text, option_text, is_correct)
  ON seed.question_text = question.text
WHERE skill.name = 'JavaScript';
