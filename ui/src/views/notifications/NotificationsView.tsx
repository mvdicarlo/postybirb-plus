import React from 'react';
import { inject, observer } from 'mobx-react';
import { NotificationStore } from '../../stores/notification.store';
import { Button, Dropdown, Badge, List, Icon, Tooltip, Modal } from 'antd';
import NotificationService from '../../services/notification.service';

interface Props {
  notificationStore?: NotificationStore;
}

interface State {
  visible: boolean;
}

@inject('notificationStore')
@observer
export default class NotificationsView extends React.Component<Props, State> {
  state: State = {
    visible: false
  };

  getTextColor(type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'): string {
    switch (type) {
      case 'SUCCESS':
        return 'text-success';
      case 'WARNING':
        return 'text-warning';
      case 'ERROR':
        return 'text-danger';
      case 'INFO':
        return 'text-blue-100';
    }
  }

  render() {
    const notifications = this.props.notificationStore!.notifications;

    const notificationSection = (
      <List
        pagination={{
          pageSize: 5
        }}
        footer={
          notifications.length ? (
            <div>
              <Button type="danger" block onClick={() => NotificationService.removeAll()}>
                Clear
              </Button>
            </div>
          ) : null
        }
        size="small"
        dataSource={notifications}
        renderItem={item => (
          <List.Item
            actions={[
              <Icon
                type="delete"
                className="text-danger"
                onClick={() => NotificationService.remove(item._id)}
              />
            ]}
          >
            <List.Item.Meta
              title={<span className={this.getTextColor(item.type)}>{item.title}</span>}
              description={
                <div>
                  <div style={{ whiteSpace: 'pre-line' }}>{item.body}</div>
                  <div>{new Date(item.created).toLocaleString()}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    );

    return (
      <div style={{ marginRight: '4px' }}>
        <Badge dot={!!notifications.filter(n => !n.viewed).length}>
          <Tooltip title="Notifications" placement="left">
            <Icon
              className="text-link"
              type="bell"
              onClick={() => this.setState({ visible: true })}
            />
          </Tooltip>
        </Badge>
        <Modal
          title="Notifications"
          visible={this.state.visible}
          footer={null}
          onCancel={() => {
            this.setState({ visible: false });
            const newlyViewed = notifications.filter(n => !n.viewed).map(n => n._id);
            if (newlyViewed.length) {
              NotificationService.markAsViewed(newlyViewed);
            }
          }}
          destroyOnClose={true}
        >
          {notificationSection}
        </Modal>
      </div>
    );
  }
}
