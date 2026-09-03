const TILT_DEAD_ZONE = 3; // Минимальный наклон в градусах, чтобы мелкая дрожь телефона не двигала игрока.
const TILT_MAX = 24; // Наклон в градусах, при котором игрок получает максимальную скорость влево или вправо.

export class InputManager { // Класс отвечает за перевод ввода игрока в событие steer для GameScene.
  constructor(scene) { // Конструктор подключает управление к конкретной Phaser-сцене.
    this.scene = scene; // Сохраняем сцену, чтобы отправлять ей события управления.
    this.usingTilt = false; // Флаг показывает, что телефон уже присылает данные наклона.
    this.permissionRequested = false; // Флаг защищает от повторных запросов доступа к датчикам на iOS.

    this.onOrientation = (event) => this.handleOrientation(event); // Храним обработчик наклона, чтобы потом корректно его удалить.
    this.onPointerDown = (pointer) => this.handlePointerDown(pointer); // Храним обработчик первого касания или клика.
    this.onPointerMove = (pointer) => this.handlePointerMove(pointer); // Храним обработчик движения пальца как fallback для компьютера.

    window.addEventListener('deviceorientation', this.onOrientation); // Слушаем наклон телефона вправо и влево.
    scene.input.on('pointerdown', this.onPointerDown); // Первое касание нужно для запроса разрешения на датчики и fallback-управления.
    scene.input.on('pointermove', this.onPointerMove); // Движение пальца оставляем только как запасной вариант без датчиков.
  }

  async handlePointerDown(pointer) { // Обрабатываем первое нажатие на экран или клик мышью.
    await this.requestTiltPermission(); // На iPhone доступ к наклону можно запросить только после действия пользователя.
    this.emitPointerFallback(pointer); // Если наклон недоступен, управление всё ещё можно проверить мышью или пальцем.
  }

  handlePointerMove(pointer) { // Обрабатываем движение пальца или мыши по экрану.
    if (!pointer.isDown) return; // Игнорируем движение курсора без зажатой кнопки или активного касания.
    this.emitPointerFallback(pointer); // Используем старую схему только как fallback, когда датчики наклона не работают.
  }

  async requestTiltPermission() { // Запрашиваем доступ браузера к датчикам ориентации, если это требуется.
    if (this.permissionRequested) return; // Повторный запрос не нужен и может раздражать пользователя.
    this.permissionRequested = true; // Сразу отмечаем, что попытка запроса уже была.
    const orientation = window.DeviceOrientationEvent; // Берём API ориентации устройства из браузера.
    const request = orientation?.requestPermission; // На iOS Safari здесь находится функция запроса разрешения.
    if (typeof request !== 'function') return; // В Android и desktop чаще всего отдельное разрешение не требуется.
    try { // Оборачиваем запрос в try, потому что браузер может отказать или бросить ошибку.
      await request.call(orientation); // Показываем системный запрос доступа к наклону телефона.
    } catch { // Если пользователь отказал или браузер не дал доступ, игра продолжит работать через fallback.
      this.usingTilt = false; // Явно оставляем режим наклона выключенным.
    }
  }

  handleOrientation(event) { // Обрабатываем каждое изменение наклона телефона.
    if (event.gamma == null) return; // gamma отвечает за наклон влево-вправо в портретной ориентации.
    const steer = this.getTiltSteer(event.gamma); // Превращаем градусы наклона в значение от -1 до 1.
    this.usingTilt = true; // Помечаем, что настоящие данные датчика уже получены.
    this.scene.events.emit('steer', steer); // Отправляем GameScene направление: минус влево, плюс вправо.
  }

  getTiltSteer(gamma) { // Преобразует наклон телефона в силу движения игрока.
    const absTilt = Math.abs(gamma); // Считаем модуль наклона, чтобы применить dead zone.
    if (absTilt < TILT_DEAD_ZONE) return 0; // В маленькой зоне около нуля игрок не должен сноситься в сторону.
    const activeTilt = gamma - Math.sign(gamma) * TILT_DEAD_ZONE; // Убираем dead zone из полезного наклона.
    const activeRange = TILT_MAX - TILT_DEAD_ZONE; // Это диапазон наклона от начала движения до максимальной скорости.
    const rawSteer = activeTilt / activeRange; // Получаем нормализованное направление движения.
    return Math.max(-1, Math.min(1, rawSteer)); // Ограничиваем результат, чтобы скорость не стала выше максимальной.
  }

  emitPointerFallback(pointer) { // Запасное управление нужно для проверки игры на компьютере без датчика наклона.
    if (this.usingTilt) return; // Если телефон уже управляет наклоном, касания больше не двигают игрока.
    this.scene.events.emit('steer', this.getPointerSteer(pointer)); // Отправляем направление по позиции пальца, как было раньше.
  }

  getPointerSteer(pointer) { // Старая формула управления по позиции касания используется только как fallback.
    const { width } = this.scene.scale; // Берём текущую ширину игрового экрана.
    const dir = (pointer.x / width - 0.5) * 2; // Левая половина даёт минус, правая половина даёт плюс.
    return Math.max(-1, Math.min(1, dir)); // Ограничиваем направление диапазоном от -1 до 1.
  }

  destroy() { // Метод отключает все обработчики ввода при уничтожении сцены.
    window.removeEventListener('deviceorientation', this.onOrientation); // Убираем слушатель наклона телефона.
    this.scene.input.off('pointerdown', this.onPointerDown); // Убираем обработчик первого касания или клика.
    this.scene.input.off('pointermove', this.onPointerMove); // Убираем обработчик движения пальца или мыши.
  }
}
