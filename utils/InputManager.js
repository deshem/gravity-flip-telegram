const TILT_DEAD_ZONE = 2; // Минимальный наклон в градусах, чтобы мелкая дрожь телефона не двигала игрока.
const TILT_MAX = 22; // Наклон в градусах, при котором игрок получает максимальную скорость влево или вправо.
const MOTION_DEAD_ZONE = 0.6; // Минимальное ускорение по оси X, чтобы запасной датчик не реагировал на шум.
const MOTION_MAX = 6; // Ускорение по оси X, при котором запасной датчик даёт максимальную скорость.
const SENSOR_TIMEOUT_MS = 700; // Время, после которого считаем, что датчик наклона пока не работает.

export class InputManager { // Класс отвечает за перевод ввода игрока в событие steer для GameScene.
  constructor(scene) { // Конструктор подключает управление к конкретной Phaser-сцене.
    this.scene = scene; // Сохраняем сцену, чтобы отправлять ей события управления.
    this.currentSteer = 0; // Храним последнее направление от датчиков, чтобы отправлять его каждый кадр.
    this.usingTilt = false; // Флаг показывает, что телефон уже присылает данные наклона или движения.
    this.permissionRequested = false; // Флаг защищает от повторных запросов доступа к датчикам на iOS.
    this.lastSensorAt = 0; // Запоминаем время последнего рабочего события от датчика телефона.
    this.lastOrientationAt = 0; // Запоминаем время последнего события deviceorientation, если оно доступно.

    this.onOrientation = (event) => this.handleOrientation(event); // Храним обработчик наклона, чтобы потом корректно его удалить.
    this.onMotion = (event) => this.handleMotion(event); // Храним обработчик движения телефона как запасной вариант для Telegram WebView.
    this.onSceneUpdate = () => this.emitStoredSteer(); // Храним обработчик кадра, чтобы наклон не затухал между событиями датчика.
    this.onPointerDown = (pointer) => this.handlePointerDown(pointer); // Храним обработчик первого касания или клика.
    this.onPointerMove = (pointer) => this.handlePointerMove(pointer); // Храним обработчик движения пальца как fallback для компьютера.

    window.addEventListener('deviceorientation', this.onOrientation); // Слушаем основной API наклона телефона вправо и влево.
    window.addEventListener('devicemotion', this.onMotion); // Слушаем запасной API акселерометра, который иногда лучше работает в Telegram.
    scene.events.on('update', this.onSceneUpdate); // Каждый кадр повторно отправляем последнее направление в GameScene.
    scene.input.on('pointerdown', this.onPointerDown); // Первое касание нужно для запроса разрешения на датчики и fallback-управления.
    scene.input.on('pointermove', this.onPointerMove); // Движение пальца оставляем только как запасной вариант без датчиков.
  }

  async handlePointerDown(pointer) { // Обрабатываем первое нажатие на экран или клик мышью.
    await this.requestTiltPermission(); // На iPhone доступ к датчикам можно запросить только после действия пользователя.
    this.emitPointerFallback(pointer); // Если датчики недоступны, управление всё ещё можно проверить мышью или пальцем.
  }

  handlePointerMove(pointer) { // Обрабатываем движение пальца или мыши по экрану.
    if (!pointer.isDown) return; // Игнорируем движение курсора без зажатой кнопки или активного касания.
    this.emitPointerFallback(pointer); // Используем старую схему только как fallback, когда датчики телефона не работают.
  }

  async requestTiltPermission() { // Запрашиваем доступ браузера к датчикам ориентации и движения, если это требуется.
    if (this.permissionRequested) return; // Повторный запрос не нужен и может раздражать пользователя.
    this.permissionRequested = true; // Сразу отмечаем, что попытка запроса уже была.
    await this.requestSensorPermission(window.DeviceOrientationEvent); // Запрашиваем доступ к deviceorientation на iOS, если браузер этого требует.
    await this.requestSensorPermission(window.DeviceMotionEvent); // Запрашиваем доступ к devicemotion на iOS, если браузер этого требует.
  }

  async requestSensorPermission(sensorEvent) { // Универсально запрашивает разрешение для одного sensor API.
    const request = sensorEvent?.requestPermission; // На iOS здесь может лежать функция системного запроса.
    if (typeof request !== 'function') return; // На Android и desktop отдельного запроса обычно нет.
    try { // Оборачиваем запрос в try, потому что браузер может отказать или бросить ошибку.
      await request.call(sensorEvent); // Показываем системный запрос доступа к конкретному датчику.
    } catch { // Если пользователь отказал или WebView не дал доступ, игра продолжит через fallback.
      this.usingTilt = false; // Явно оставляем режим датчиков выключенным.
    }
  }

  handleOrientation(event) { // Обрабатываем каждое изменение наклона телефона.
    if (event.gamma == null) return; // gamma отвечает за наклон влево-вправо в портретной ориентации.
    this.currentSteer = this.getTiltSteer(event.gamma); // Превращаем градусы наклона в значение от -1 до 1.
    this.usingTilt = true; // Помечаем, что настоящие данные датчика уже получены.
    this.lastSensorAt = performance.now(); // Обновляем время последнего рабочего датчика.
    this.lastOrientationAt = this.lastSensorAt; // Запоминаем, что основной orientation API сейчас живой.
  }

  handleMotion(event) { // Обрабатываем запасные данные акселерометра телефона.
    if (performance.now() - this.lastOrientationAt < SENSOR_TIMEOUT_MS) return; // Если orientation работает, не смешиваем два источника сразу.
    const x = event.accelerationIncludingGravity?.x; // Берём ускорение с учётом гравитации по горизонтальной оси телефона.
    if (x == null) return; // Если браузер не дал ось X, этот способ управления недоступен.
    this.currentSteer = this.getMotionSteer(x); // Превращаем ускорение телефона в значение от -1 до 1.
    this.usingTilt = true; // Помечаем, что телефон присылает реальные sensor-данные.
    this.lastSensorAt = performance.now(); // Обновляем время последнего рабочего датчика.
  }

  emitStoredSteer() { // Каждый кадр отправляет последнее направление наклона в GameScene.
    if (!this.usingTilt) return; // Пока датчики не заработали, не мешаем fallback-управлению.
    if (performance.now() - this.lastSensorAt > SENSOR_TIMEOUT_MS) return; // Если датчик замолчал, не держим старое движение бесконечно.
    this.scene.events.emit('steer', this.currentSteer); // Повторяем последний наклон, чтобы GameScene не успевала его затухать.
  }

  getTiltSteer(gamma) { // Преобразует наклон телефона в силу движения игрока.
    const absTilt = Math.abs(gamma); // Считаем модуль наклона, чтобы применить dead zone.
    if (absTilt < TILT_DEAD_ZONE) return 0; // В маленькой зоне около нуля игрок не должен сноситься в сторону.
    const activeTilt = gamma - Math.sign(gamma) * TILT_DEAD_ZONE; // Убираем dead zone из полезного наклона.
    const activeRange = TILT_MAX - TILT_DEAD_ZONE; // Это диапазон наклона от начала движения до максимальной скорости.
    const rawSteer = activeTilt / activeRange; // Получаем нормализованное направление движения.
    return Math.max(-1, Math.min(1, rawSteer)); // Ограничиваем результат, чтобы скорость не стала выше максимальной.
  }

  getMotionSteer(x) { // Преобразует данные акселерометра в силу движения игрока.
    const absMotion = Math.abs(x); // Считаем модуль ускорения, чтобы применить dead zone.
    if (absMotion < MOTION_DEAD_ZONE) return 0; // Маленькое ускорение считаем шумом и не двигаем игрока.
    const activeMotion = x - Math.sign(x) * MOTION_DEAD_ZONE; // Убираем dead zone из полезного ускорения.
    const activeRange = MOTION_MAX - MOTION_DEAD_ZONE; // Это диапазон ускорения от начала движения до максимальной скорости.
    const rawSteer = activeMotion / activeRange; // Получаем нормализованное направление движения.
    return Math.max(-1, Math.min(1, rawSteer)); // Ограничиваем результат диапазоном от -1 до 1.
  }

  emitPointerFallback(pointer) { // Запасное управление нужно для проверки игры на компьютере без датчика наклона.
    if (this.usingTilt && performance.now() - this.lastSensorAt <= SENSOR_TIMEOUT_MS) return; // Если датчики работают, касания больше не двигают игрока.
    this.scene.events.emit('steer', this.getPointerSteer(pointer)); // Отправляем направление по позиции пальца, как было раньше.
  }

  getPointerSteer(pointer) { // Старая формула управления по позиции касания используется только как fallback.
    const { width } = this.scene.scale; // Берём текущую ширину игрового экрана.
    const dir = (pointer.x / width - 0.5) * 2; // Левая половина даёт минус, правая половина даёт плюс.
    return Math.max(-1, Math.min(1, dir)); // Ограничиваем направление диапазоном от -1 до 1.
  }

  destroy() { // Метод отключает все обработчики ввода при уничтожении сцены.
    window.removeEventListener('deviceorientation', this.onOrientation); // Убираем слушатель наклона телефона.
    window.removeEventListener('devicemotion', this.onMotion); // Убираем слушатель акселерометра телефона.
    this.scene.events.off('update', this.onSceneUpdate); // Убираем покадровую отправку сохранённого направления.
    this.scene.input.off('pointerdown', this.onPointerDown); // Убираем обработчик первого касания или клика.
    this.scene.input.off('pointermove', this.onPointerMove); // Убираем обработчик движения пальца или мыши.
  }
}
