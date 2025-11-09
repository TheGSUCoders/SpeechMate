package hack.thegsucoders.speechmate.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class UserController {

    @Value("${frontend.url}")
    private String frontendUrl;

    @GetMapping("/api/user")
    public Map<String, Object> user(@AuthenticationPrincipal OAuth2User principal) {
        Map<String, Object> userInfo = new HashMap<>();
        
        if (principal != null) {
            userInfo.put("name", principal.getAttribute("name"));
            userInfo.put("email", principal.getAttribute("email"));
            userInfo.put("picture", principal.getAttribute("picture"));
            userInfo.put("authenticated", true);
        } else {
            userInfo.put("authenticated", false);
        }
        
        return userInfo;
    }

    @GetMapping("/api/config/check")
    public Map<String, Object> checkConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("frontendUrl", frontendUrl);
        config.put("frontendUrlIsSet", frontendUrl != null && !frontendUrl.isEmpty());
        return config;
    }
}
