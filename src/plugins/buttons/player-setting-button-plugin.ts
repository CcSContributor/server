import { buttonAction, ButtonActionPlugin } from '@server/world/mob/player/action/button-action';

const buttonIds: number[] = [
    152, 153, // walk/run
    930, 931, 932, 933, 934, // music volume
    941, 942, 943, 944, 945, // sound effect volume
    957, 958, // split private chat
    913, 914, // mouse buttons
    906, 908, 910, 912, // screen brightness
    915, 916, // chat effects
    12464, 12465, // accept aid
    150, 151, // auto retaliate
];

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;
    player.settingChanged(buttonId);
};

export default { buttonIds, action } as ButtonActionPlugin;