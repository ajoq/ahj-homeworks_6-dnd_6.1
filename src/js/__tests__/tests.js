import hello from '../app';

test('hello function', () => {
  const expected = 'Привет!';
  const received = hello('Привет!');
  expect(received).toBe(expected);
});
