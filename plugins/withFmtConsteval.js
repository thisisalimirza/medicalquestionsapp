const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Newer Xcode/Clang toolchains (e.g. on macOS beta releases) reject the bundled
 * `fmt` library's `consteval` FMT_STRING usage with:
 *   "call to consteval function ... is not a constant expression"
 *
 * Defining FMT_USE_CONSTEVAL=0 across the Pods project disables fmt's consteval
 * path so it compiles with the stricter compiler. This is injected into the
 * generated Podfile's post_install so it survives `expo prebuild`.
 */
module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes('FMT_USE_CONSTEVAL')) return cfg;

      const marker = 'post_install do |installer|';
      const injection = `${marker}
    installer.pods_project.targets.each do |fmt_target|
      fmt_target.build_configurations.each do |fmt_config|
        defs = fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        defs = [defs] unless defs.is_a?(Array)
        fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs + ['FMT_USE_CONSTEVAL=0']
      end
    end`;

      contents = contents.replace(marker, injection);
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
