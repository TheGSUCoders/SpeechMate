package hack.thegsucoders.speechmate.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProbeController {

    @GetMapping("/robots933456.txt")
    public ResponseEntity<String> probe() {
        return ResponseEntity.ok("User-agent: *\nDisallow:");
    }
}
