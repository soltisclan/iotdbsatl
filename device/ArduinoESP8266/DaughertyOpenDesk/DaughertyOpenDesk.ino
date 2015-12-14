#include <ESP8266WiFi.h>

/********************************************************
Blue LED diagnostic codes:
1- 1hz toggle, infinite, wifi initial connection failed
2- .5hz toggle, 3times, wificlient can't make http call
********************************************************/


/************************************
Globals to support WiFi &
Network functions
*************************************/
//const char* Ssid1     = "test2";
//const char* Password1 = "";
//const char* Ssid2     = "testp";
//const char* Password2 = "";
const char* Ssid1     = "DBSGUEST";
const char* Password1 = "";
const char* Ssid2     = "PhippsConferenceCenter";
const char* Password2 = "";
const char* Hostname = "DBSDODButton0005";
const char* Host = "iotdbsatl.azurewebsites.net";
const int HttpPort = 80;
String Url = "/api?device=";
const int InitialConnectionAttempts=60; //attempts are at .5 sec iterations, total of 30 seconds


/************************************
Globals to support Non-WiFi 
  & Network functions
*************************************/
unsigned int MyButtonId = 5;
bool Debug=false;
bool Occupied=false;
bool CallWebAPI=false;
unsigned long ButtonPressTime = 0;  
unsigned long LastButtonPressTime = 0;
unsigned long ButtonLifetime=0;  //counter only applies for current power cycle
const unsigned int OnboardLED=0;
const unsigned int RedLED=4;
const unsigned int GreenLED=5;
const unsigned int BlueLED=13;

/************************************
*
**END of all global vars
*
*************************************/



/************************************
This is an interrupt handler
to be registered during startup.
*************************************/
void HandleButton(){
  //millis used to handle basic debounce control
  ButtonPressTime = millis();
  
  //check to see if we got a press in the last 250 milliseconds
  if (ButtonPressTime - LastButtonPressTime > 250)
  {
    Occupied = !Occupied;
    CallWebAPI=true;
    ButtonLifetime++;
    LastButtonPressTime = ButtonPressTime;
  }
}

/************************************
This is a simple debug writer for
the serial monitor. 
*************************************/  
void WriteDebug(){
    Serial.print("Button lifetime counter: ");
    Serial.print(ButtonLifetime,DEC);
    Serial.print(" Button state: ");
    Serial.println(Occupied,DEC);
}


/************************************
This method turns all Button LEDs off
*************************************/  
void LEDsOff(){
    digitalWrite(RedLED,HIGH);
    digitalWrite(GreenLED,HIGH);
    digitalWrite(BlueLED,HIGH);  
}

/*************************************************************
Blue LED diagnostic method
-Alternates between Blue Button LED and Onboard Red LED
-Expand the two switch statements as needed.
-Latching diagnostics are never exited until reset/power cycle
-Non-latching diagnostics are for non-fatal exception events. The
 intent is to indicate to the user of an exception, e.g. cannot
 reach the API but the local wifi connection is OK.
*************************************************************/
void FlashDiagnostic(int code, bool latch){
  if(latch){  
    LEDsOff();
    
    //never leave here until poweroff/reset
    while(1){  
    switch(code){
        case 1:
        digitalWrite(BlueLED,HIGH);    
        digitalWrite(OnboardLED,LOW);             
        delay(1000);
        digitalWrite(BlueLED,LOW);     
        digitalWrite(OnboardLED,HIGH);             
        delay(1000);
        Serial.println("Diagnostic: unable to connect to designated WiFi network.");
        break;          
      }    
    }    
  }

  //flash diagnostic codes but continue normal execution
  switch(code){
      case 2:
      LEDsOff();
        for(int i=0;i<=3;i++){
          digitalWrite(BlueLED,LOW);
          digitalWrite(OnboardLED,HIGH);         
          delay(500);
          digitalWrite(BlueLED,HIGH); 
          digitalWrite(OnboardLED,LOW);        
          delay(500);
        }
      break;          
    }    
  
  //always ensure Blue LED and Onboard LED are off when leaving  
  digitalWrite(BlueLED,HIGH);  
  digitalWrite(OnboardLED,HIGH);       

  //restore LED states
  if(Occupied){
    digitalWrite(RedLED,LOW);     
    digitalWrite(GreenLED,HIGH);     
  }
  else{
    digitalWrite(RedLED,HIGH);     
    digitalWrite(GreenLED,LOW);     
  } 
    
}

/*************************************************************
ConnectionToWiFiAttempt
Simple loop to extend connection attempt to 30 sec per
the InitialConnectionAttempts const.  Called by
ConnectToWiFi() method.
*************************************************************/
void ConnectionToWiFiAttempt(){
    int count=1;
    while (WiFi.status() != WL_CONNECTED && count<InitialConnectionAttempts) {
    digitalWrite(BlueLED,LOW) ;   
    Serial.print(".");
    delay(250);
    digitalWrite(BlueLED,HIGH);
    Serial.print(".");
    delay(250);
    count++;
  }

}

/*************************************************************
ConnectToWiFi
Pretty straight forward, attempt on two different SSIDs
*************************************************************/
void ConnectToWiFi(){
  Serial.println();
  Serial.print("Attempting connection to ");
  Serial.println(Ssid1);
  WiFi.hostname(Hostname);
  WiFi.begin(Ssid1, Password1);

  ConnectionToWiFiAttempt();
  
  if(WiFi.status() != WL_CONNECTED){
    WiFi.disconnect();
    Serial.println();
    Serial.println("Connection failed.");
    Serial.print("Attempting connection to ");
    Serial.println(Ssid2);    
    WiFi.begin(Ssid2, Password2);
    ConnectionToWiFiAttempt();
  }

  digitalWrite(OnboardLED,HIGH); //turn led off
  if(WiFi.status() != WL_CONNECTED) //if still not connected by now, bail out and never leave Diagnostic flash
    FlashDiagnostic(1,true);
  
  Serial.println("...");
  Serial.println("");
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());  
}


/************************************
Standard Arduino initialization to
be executed once.
*************************************/  
void setup() {

  Serial.begin(115200);
  Serial.println("Setting up.");
  pinMode(OnboardLED,OUTPUT); //use ESP8266 onboard LED
  digitalWrite(OnboardLED,HIGH); //ensure LED is off

  pinMode(RedLED,OUTPUT);
  digitalWrite(RedLED,HIGH); //set inital off  
  pinMode(GreenLED,OUTPUT);
  digitalWrite(GreenLED,HIGH); //set initial off
  pinMode(BlueLED,OUTPUT);
  digitalWrite(BlueLED,HIGH); //set initial off
  
  //register an interrupt to watch the button
  attachInterrupt(2, HandleButton, FALLING);

  //get Button ID and append to URL
  //Url +=  GetButtonID();
  char x[4];
  sprintf(x,"%04d",MyButtonId);
  Url += x;
      
  //Connect to WiFi 
  ConnectToWiFi();

  //set inital state with API
  Serial.println("Calling API to set initial state.");
  UpdateWebAPI();
}

/************************************
This method will make a call to the 
Cloud API to either set the occupied
state to 1 or 0.
*************************************/  
void UpdateWebAPI(){
    Serial.println("Calling WebAPI.");
    
    WiFiClient client;    
    if (!client.connect(Host, HttpPort)) {
      Serial.println("Connection to API failed, abort API call.");
      WriteDebug();
      FlashDiagnostic(2,false);
      return;
    }

   String UrlToPost;   
   if(Occupied)
      UrlToPost = Url + "&occupied=1";
   else
      UrlToPost = Url + "&occupied=0";   
   
   Serial.print("Requesting URL: ");
   Serial.println(UrlToPost);
  
   // This will send the request to the server
   client.print(String("GET ") + UrlToPost + " HTTP/1.1\r\n" +
                 "Host: " + Host + "\r\n" + 
                 "Connection: close\r\n\r\n");
   delay(25); //10
    
    // Read all the lines of the reply from server and print them to Serial
    Serial.println("Response from server: ");    
    while(client.available()){
      String line = client.readStringUntil('\r');
      Serial.print(line);
    }
    
    WriteDebug(); //print out current state
}


/************************************
This is the standard Arduino loop
which will run continusly, acting only
on variables changed by the HandleButton
interrup routine.
*************************************/  
void loop() {
    if(Debug){
      WriteDebug();
      delay(500);
    }
    
    if(Occupied){
      digitalWrite(RedLED,LOW); 
      digitalWrite(GreenLED,HIGH);
    }
    else{
      digitalWrite(RedLED,HIGH); 
      digitalWrite(GreenLED,LOW); 
    }

    if(CallWebAPI) //note this is set by the interrupt handler HandleButton()
      UpdateWebAPI();

    //reset back to false      
    CallWebAPI=false;    
}













