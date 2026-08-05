import { fakeAsync, tick } from '@angular/core/testing';
import { PlayerItem } from '../core/player.models';
import { PlaybackComponent } from './playback.component';

describe('PlaybackComponent', () => {
  let component: PlaybackComponent;

  beforeEach(() => {
    component = new PlaybackComponent();
  });

  afterEach(() => component.ngOnDestroy());

  it('ordena a playlist, respeita duração da imagem e repete', fakeAsync(() => {
    component.items = [item(2, 2, 'VIDEO', null), item(1, 1, 'IMAGEM', 2)];

    expect(component.currentItem?.id).toBe(1);
    component.onImageLoaded();
    expect(component.mediaVisible).toBeTrue();
    tick(1999);
    expect(component.currentItem?.id).toBe(1);
    tick(1);
    expect(component.currentItem?.id).toBe(1);
    expect(component.mediaVisible).toBeFalse();
    tick(500);
    expect(component.currentItem?.id).toBe(2);
    component.onVideoEnded();
    tick(500);
    expect(component.currentItem?.id).toBe(1);
  }));

  it('usa duração natural do vídeo quando não há limite', fakeAsync(() => {
    const video = jasmine.createSpyObj<HTMLVideoElement>('video', ['play']);
    video.play.and.returnValue(Promise.resolve());
    component.items = [item(1, 1, 'VIDEO', null), item(2, 2, 'IMAGEM', 1)];

    component.onVideoReady(video);
    tick(30_000);
    expect(component.currentItem?.id).toBe(1);
    component.onVideoEnded();
    expect(component.mediaVisible).toBeFalse();
    tick(500);
    expect(component.currentItem?.id).toBe(2);
  }));

  it('avança após erro e aplica atualização somente ao terminar o item atual', fakeAsync(() => {
    component.items = [item(1, 1, 'VIDEO', null), item(2, 2, 'IMAGEM', 1)];
    component.items = [item(3, 1, 'IMAGEM', 1)];

    expect(component.currentItem?.id).toBe(1);
    component.onMediaError();
    tick(499);
    expect(component.currentItem?.id).toBe(1);
    tick(1);
    expect(component.currentItem?.id).toBe(3);
  }));

  it('repete playlist de item único sem travar', fakeAsync(() => {
    const changes: Array<number | undefined> = [];
    component.mediaChange.subscribe((id) => changes.push(id));
    component.items = [item(1, 1, 'IMAGEM', 1)];
    component.onImageLoaded();
    tick(1500);

    expect(component.currentItem?.id).toBe(1);
    expect(changes).toEqual([11, 11]);
  }));

  it('só revela a próxima mídia depois que ela estiver pronta', fakeAsync(() => {
    component.items = [item(1, 1, 'IMAGEM', 1), item(2, 2, 'VIDEO', null)];
    component.onImageLoaded();

    tick(1000);
    expect(component.mediaVisible).toBeFalse();
    tick(500);
    expect(component.currentItem?.id).toBe(2);
    expect(component.mediaVisible).toBeFalse();

    const video = jasmine.createSpyObj<HTMLVideoElement>('video', ['play']);
    video.play.and.returnValue(Promise.resolve());
    component.onVideoReady(video);
    expect(component.mediaVisible).toBeTrue();
  }));

  it('controla vídeo com o direcional do controle remoto', () => {
    const video = document.createElement('video');
    const play = spyOn(video, 'play').and.returnValue(Promise.resolve());
    const pause = spyOn(video, 'pause');
    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    Object.defineProperty(video, 'duration', { value: 60, configurable: true });
    video.currentTime = 20;
    component.items = [item(1, 1, 'VIDEO', null)];
    component.onVideoReady(video);

    component.onRemoteKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(pause).toHaveBeenCalled();

    Object.defineProperty(video, 'paused', { value: true, configurable: true });
    component.onRemoteKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(play).toHaveBeenCalledTimes(2);

    component.onRemoteKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(video.currentTime).toBe(30);
    component.onRemoteKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(video.currentTime).toBe(20);
  });

  function item(
    id: number,
    order: number,
    type: 'IMAGEM' | 'VIDEO',
    duration: number | null
  ): PlayerItem {
    return {
      id,
      ordem: order,
      duracaoSegundos: duration,
      midia: {
        id: id + 10,
        nome: `Mídia ${id}`,
        tipo: type,
        orientacao: 'HORIZONTAL',
        mimeType: type === 'IMAGEM' ? 'image/png' : 'video/mp4',
        largura: 1920,
        altura: 1080,
        url: `https://media/${id}`,
        urlExpiraEm: null
      }
    };
  }
});
