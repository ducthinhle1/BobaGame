import {describe, expect, it} from 'vitest';
import {countErrors, isReady, judge, matchParts} from './cup';
import type {Cup, Order} from '../types';

const cup = (p: Partial<Cup> = {}): Cup => ({tea: null, sugar: null, ice: null, tops: [], level: 0, teaQ: null, pearlQ: null, sealed: false, ...p});
const order: Order = {tea: 'taro', sugar: 50, ice: 1, tops: ['pearl']};

describe('matchParts', () => {
  it('an empty cup matches nothing, not even an empty topping list', () => {
    expect(matchParts(cup(), {...order, tops: []})).toEqual({tea: false, sugar: false, ice: false, tops: false});
  });
  it('turns each part green as it is added', () => {
    const m = matchParts(cup({tea: 'taro', sugar: 50}), order);
    expect(m).toEqual({tea: true, sugar: true, ice: false, tops: false});
  });
  it('no-topping orders match once there is tea in the cup', () => {
    expect(matchParts(cup({tea: 'taro'}), {...order, tops: []}).tops).toBe(true);
  });
  it('topping order does not matter', () => {
    expect(matchParts(cup({tea: 'taro', tops: ['grass', 'pearl']}), {...order, tops: ['pearl', 'grass']}).tops).toBe(true);
  });
});

describe('isReady / countErrors', () => {
  const done = cup({tea: 'taro', sugar: 50, ice: 1, tops: ['pearl']});
  it('a correct cup is ready with no errors', () => {
    expect(isReady(done, order)).toBe(true);
    expect(countErrors(done, order)).toBe(0);
  });
  it('counts each wrong step once', () => {
    expect(countErrors({...done, sugar: 70}, order)).toBe(1);
    expect(countErrors({...done, sugar: 70, ice: 2}, order)).toBe(2);
  });
  it('counts an extra topping and a missing topping separately', () => {
    expect(countErrors({...done, tops: ['grass']}, order)).toBe(2);
  });
  it('an unfinished cup is not ready', () => {
    expect(isReady({...done, ice: null}, order)).toBe(false);
  });
});

describe('judge', () => {
  it('perfect / close / wrong', () => {
    expect(judge(0, true)).toBe('perfect');
    expect(judge(1, false)).toBe('close');
    expect(judge(1, true)).toBe('wrong');
    expect(judge(2, false)).toBe('wrong');
  });
});
