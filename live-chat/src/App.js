import React, {
  useState,
  useEffect
} from 'react';
import './App.css';
import useInput from './useInput.js';
import PubNub from 'pubnub';
import {
  Card,
  CardActions,
  CardContent,
  List,
  ListItem,
  Button,
  Typography,
  Input
} from '@material-ui/core';

function App() {
  // Set default channel
  let defaultChannel = "Global";
  let query = window.location.search.substring(1);
  let params = query.split("&");
  for (let i = 0; i < params.length; i++) {
    var pair = params[i].split("=");
    if (pair[0] === "channel" && pair[1] !== "") {
      defaultChannel = decodeURI(pair[1]);
    }
  }

  // Set state
  const [channel, setChannel] = useState(defaultChannel);
  const [messages, setMessages] = useState([]);
  const [username, ] = useState(['user', new Date().getTime()].join('-'));
  const tempChannel = useInput();
  const tempMessage = useInput();

  // Set up PubNub, handle eents, rerun on channel update
  useEffect(() => {
    console.log("Setting up PubNub");
    const pubnub = new PubNub({
      publishKey: "pub-c-5ab0e177-a72b-4a58-861c-0fc226fc4243",
      subscribeKey: "sub-c-b195c3ec-7262-11eb-9641-66d8dbfc759a",
      uuid: username
    });

    // Add PubNub listeners
    pubnub.addListener({
      status: (statusEvent) => {
        if (statusEvent.category === "PNConnectedCategory") {
          console.log("Connected to PubNub!")
        }
      },
      message: (msg) => {
        if (msg.message.text) {
          // console.log(msg.message.text)
          let newMessages = [];
          newMessages.push({
            uuid: msg.message.uuid,
            text: msg.message.text
          });
          setMessages(messages => messages.concat(newMessages))
        }
      }
    });

    // Subscribe to state channel
    pubnub.subscribe({
      channels: [channel]
    });

    // Fetch history
    pubnub.history({
      channel: channel,
      count: 10, // default 100
      stringifiedTimeToken: true // default false
    }, (status, response) => {
      let newMessages = [];
      for (let i = 0; i < response.messages.length; i++) {
        newMessages.push({
          uuid: response.messages[i].entry.uuid,
          text: response.messages[i].entry.text
        });
      }
      setMessages(messages => messages.concat(newMessages));
    });

    // End
    return function cleanup() {
      console.log("shutting down pubnub");
      pubnub.unsubscribeAll();
      setMessages([]);
    }
  }, [channel, username]);

  // Back listener
  useEffect(() => {
    window.addEventListener("popstate", goBack);

    return function cleanup() {
      window.removeEventListener("popstate", goBack);
    }
  }, []);

  // Handle inputs
  function handleKeyDown(event) {
    if (event.target.id === "messageInput") {
      if (event.key === 'Enter') {
        publishMessage();
      }
    } else if (event.target.id === "channelInput") {
      if (event.key === 'Enter') {
        // Navigates to new channels
        const newChannel = tempChannel.value.trim();
        if (newChannel) {
          if (channel !== newChannel) {
            // If different channel
            setChannel(newChannel);
            let newURL = window.location.origin + "?channel=" + newChannel;
            window.history.pushState(null, '', newURL);
            tempChannel.setValue('');
          }
        } else {
          // If no channel input
          if (channel !== "Global") {
            // If different channel
            setChannel("Global");
            let newURL = window.location.origin;
            window.history.pushState(null, '', newURL);
            tempChannel.setValue('');
          }
        }
      }
    }
  }

  // Sending messages via PubNub
  function publishMessage() {
    if (tempMessage.value) {
      let messageObject = {
        text: tempMessage.value,
        uuid: username
      };

      const pubnub = new PubNub({
        publishKey: "pub-c-5ab0e177-a72b-4a58-861c-0fc226fc4243",
        subscribeKey: "sub-c-b195c3ec-7262-11eb-9641-66d8dbfc759a",
        uuid: username
      });

      pubnub.publish({
        message: messageObject,
        channel: channel
      });

      tempMessage.setValue('');
    }
  }

  function goBack() {
    let query = window.location.search.substring(1);
    if (!query) {
      setChannel("Global")
    } else {
      let params = query.split("&");
      for (let i = 0; i < params.length; i++) {
        var pair = params[i].split("=");
        //If the user input a channel then the default channel is now set
        //If not, we still navigate to the default channel.
        if (pair[0] === "channel" && pair[1] !== "") {
          setChannel(decodeURI(pair[1]))
        }
      }
    }
  }

  // Create page component
  return(
    <Card >
        <CardContent>
          <div className="top">
            <Typography variant="h4" inline >
              PubNub React Chat
              </Typography>
            <Input
              style={{width:'100px'}}
              className="channel"
              id="channelInput"
              onKeyDown={handleKeyDown}
              placeholder ={channel}
              onChange = {tempChannel.onChange}
              value={tempChannel.value}
            />
          </div>
          <div >
            <Log messages={messages}/>
          </div>
        </CardContent>
        <CardActions>
          <Input
            placeholder="Enter a message"
            fullWidth={true}
            id="messageInput"
            value={tempMessage.value}
            onChange={tempMessage.onChange}
            onKeyDown={handleKeyDown}
            inputProps={{'aria-label': 'Message Field',}}
            autoFocus={true}
          />
          <Button
            size="small"
            color="primary"
            onClick={publishMessage}
            >
            Submit
          </Button>
        </CardActions>
    </Card>
  );
}

// List of messages component
function Log(props) {
  return(
    <List component="nav">
      <ListItem>
      <Typography component="div">
        { props.messages.map((item, index)=>(
          <Message key={index} uuid={item.uuid} text={item.text}/>
        )) }
      </Typography>
      </ListItem>
    </List>
  )
};

// Message component
function Message(props){
  return (
    <div >
      { props.uuid }: { props.text }
    </div>
  );
}

export default App;
