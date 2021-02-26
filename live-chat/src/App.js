import React, {
  useState,
  useEffect,
  useMemo
} from 'react';
import './App.css';
import useInput from './useInput.js';
import PubNub from 'pubnub';
import { v4 as uuidv4 } from 'uuid';
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
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import BlockIcon from '@material-ui/icons/Block';

function App() {
  // Set states
  const defaultChannel = "Screening Room";
  const [channel,] = useState(defaultChannel);
  const [messages, setMessages] = useState([]);
  const [username,] = useState(['user', new Date().getTime()].join('-'));
  const chatMessage = useInput();
  const pubnub = useMemo(() => {
    return new PubNub({
      publishKey: process.env.REACT_APP_PUBLISH_KEY,
      subscribeKey: process.env.REACT_APP_SUBSCRIBE_KEY,
      uuid: username
    });
  }, [username])

  // Set up PubNub
  useEffect(() => {
    console.log("Setting up PubNub");

    // Add listeners
    pubnub.addListener({
      status: (statusEvent) => {
        if (statusEvent.category === "PNConnectedCategory") {
          console.log("Connected to PubNub")
        }
      },
      message: (msg) => {
        if (msg.message.text) {
          let newMessages = [];
          newMessages.push({
            msgId: msg.message.msgId,
            uuid: msg.message.uuid,
            text: msg.message.text
          });
          setMessages(messages => messages.concat(newMessages))
        }
      }
    });

    // Subscribe to channel
    pubnub.subscribe({
      channels: [channel]
    });

    // Fetch history
    pubnub.history({
      channel: channel,
      count: 20, // default 100
      stringifiedTimeToken: true // default false
    }, (status, response) => {
      let newMessages = [];
      for (let i = 0; i < response.messages.length; i++) {
        newMessages.push({
          msgId: response.messages[i].entry.msgId,
          uuid: response.messages[i].entry.uuid,
          text: response.messages[i].entry.text
        });
      }
      setMessages(messages => messages.concat(newMessages));
    });

    // End
    return () => {
      console.log("Shutting down PubNub");
      pubnub.unsubscribeAll();
      setMessages([]);
    }
  }, [pubnub, channel, username]);

  // Handle inputs
  function handleKeyDown(event) {
    if (event.target.id === "messageInput") {
      if (event.key === 'Enter') {
        publishMessage();
      }
    }
  }

  // Sending messages via PubNub
  function publishMessage() {
    if (chatMessage.value) {
      let messageObject = {
        msgId: uuidv4(),
        uuid: username,
        text: chatMessage.value,
      };

      pubnub.publish({
        message: messageObject,
        channel: channel
      }, (status, response) => {
        if (!status.error) {
          // firestore msgId with rtt
        } else {
          console.log("Failed to publish")
        }
      });

      chatMessage.setValue('');
    }
  }

  // Delete a message
  function deleteMessage() {
    // on click of message
    // look up msgId and get timetoken
    let timetoken = "";
    pubnub.deleteMessages({
      channel: channel,
      start: String(timetoken - 1),
      end: String(timetoken),
    }, (result) => {
      console.log(result);
    })
  }

  // Create page component
  return(
    <Card >
        <CardContent>
          <div className="top">
            <Typography variant="h4" inline="true">
              Screening Room Chat
            </Typography>
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
            value={chatMessage.value}
            onChange={chatMessage.onChange}
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
        { props.messages.map((item, index) => (
          <Message key={index} id={item.msgId} uuid={item.uuid} text={item.text}/>
        )) }
      </Typography>
      </ListItem>
    </List>
  )
};

// Message component
function Message(props){  
  return (
    <div messageid={ props.id } >
      { props.uuid }: { props.text }
      <BlockIcon
        style={{float: 'right'}}
        onClick={() => { console.log('Block ' + props.uuid) }}
      />
      <DeleteOutlineIcon
        style={{float:'right'}}
        onClick={() => { console.log('Delete ' + props.id) }}
      />
    </div>
  );
}

export default App;
