import { Tabs, Tree, Empty, Button, Dropdown, Collapse } from 'antd'
import type { TreeDataNode, MenuProps, CollapseProps } from 'antd'
import {
  AppstoreOutlined,
  ApartmentOutlined,
  SettingOutlined,
  DatabaseOutlined,
  RocketOutlined,
  RobotOutlined,
  RadarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  MoreOutlined,
  BorderOutlined,
  LineOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'
import { useEditor } from '../../context/EditorContext'
import type { SceneNode } from 'core'
import {
  duplicateNode,
  createComponentDragData,
  setDragData,
  handleDragStartVisual,
  handleDragEndVisual
} from '@renderer/utils'
import styles from './index.module.less'

interface ComponentItem {
  key: string
  label: string
  icon?: React.ReactNode
}

interface ComponentGroup {
  key: string
  label: string
  icon: React.ReactNode
  items: ComponentItem[]
}

const Toolbox = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { selectedNodeId, selectNode, deleteNode, getNodes, addNode, nodesVersion } = useEditor()

  // 获取节点列表，依赖 nodesVersion 确保节点变化时重新获取
  const nodes = useMemo(() => getNodes(), [getNodes, nodesVersion])

  // 组件分组数据
  const componentGroups: ComponentGroup[] = [
    {
      key: 'industrial',
      label: t('editor.componentGroups.industrial'),
      icon: <SettingOutlined />,
      items: [
        { key: 'pump', label: '泵' },
        { key: 'valve', label: '阀门' },
        { key: 'tank', label: '储罐' },
        { key: 'pipe', label: '管道' },
        { key: 'reactor', label: '反应器' },
        { key: 'heat-exchanger', label: '换热器' }
      ]
    },
    {
      key: 'aerospace',
      label: t('editor.componentGroups.aerospace'),
      icon: <RocketOutlined />,
      items: [
        { key: 'satellite', label: '卫星' },
        { key: 'rocket', label: '火箭' },
        { key: 'antenna', label: '天线' },
        { key: 'solar-panel', label: '太阳能板' },
        { key: 'thruster', label: '推进器' }
      ]
    },
    {
      key: 'automation',
      label: t('editor.componentGroups.automation'),
      icon: <RobotOutlined />,
      items: [
        { key: 'motor', label: '电机' },
        { key: 'conveyor', label: '传送带' },
        { key: 'robot-arm', label: '机械臂' },
        { key: 'controller', label: '控制器' }
      ]
    },
    {
      key: 'sensors',
      label: t('editor.componentGroups.sensors'),
      icon: <RadarChartOutlined />,
      items: [
        { key: 'temperature-sensor', label: '温度传感器' },
        { key: 'pressure-sensor', label: '压力传感器' },
        { key: 'flow-sensor', label: '流量传感器' },
        { key: 'level-sensor', label: '液位传感器' }
      ]
    }
  ]

  // 将场景节点转换为树形结构数据
  const convertNodesToTreeData = (nodes: SceneNode[]): TreeDataNode[] => {
    return nodes.map((node) => {
      const getIcon = () => {
        switch (node.type) {
          case 'rect':
            return <BorderOutlined />
          case 'circle':
            return <div className={styles.circleIcon} />
          case 'ellipse':
            return <div className={styles.circleIcon} />
          case 'polygon':
            return <div className={styles.polygonIcon} />
          case 'line':
          case 'polyline':
            return <LineOutlined />
          case 'text':
            return <FileTextOutlined />
          default:
            return <DatabaseOutlined />
        }
      }

      const menuItems: MenuProps['items'] = [
        {
          key: 'edit',
          label: t('common.edit'),
          icon: <EditOutlined />
        },
        {
          key: 'copy',
          label: t('common.copy'),
          icon: <CopyOutlined />
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          label: t('common.delete'),
          icon: <DeleteOutlined />,
          danger: true
        }
      ]

      const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'delete') {
          deleteNode(node.id)
        } else if (key === 'copy') {
          addNode(duplicateNode(node))
        }
      }

      return {
        title: (
          <div className={styles.treeNodeTitle}>
            <span className={styles.treeNodeContent}>
              {getIcon()}
              <span className={styles.treeNodeLabel}>{node.name || node.type}</span>
            </span>
            <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
                className={styles.treeNodeAction}
              />
            </Dropdown>
          </div>
        ),
        key: node.id,
        children: node.children ? convertNodesToTreeData(node.children) : undefined,
        isLeaf: !node.children || node.children.length === 0
      }
    })
  }

  const treeData: TreeDataNode[] = convertNodesToTreeData(nodes)

  // 默认展开所有分组
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    componentGroups.map((group) => group.key)
  )

  // 处理拖拽开始
  const handleDragStart = (
    e: React.DragEvent,
    groupKey: string,
    itemKey: string,
    label: string
  ) => {
    setDragData(e, createComponentDragData(groupKey, itemKey, label))
    handleDragStartVisual(e)
  }

  // 处理拖拽结束
  const handleDragEnd = handleDragEndVisual

  // 组件列表渲染
  const renderComponents = () => {
    const collapseItems: CollapseProps['items'] = componentGroups.map((group) => ({
      key: group.key,
      label: (
        <div className={styles.collapseHeader}>
          {group.icon}
          <span className={styles.collapseTitle}>{group.label}</span>
        </div>
      ),
      children: (
        <div className={styles.groupItems}>
          {group.items.map((item) => (
            <div
              key={item.key}
              className={styles.componentItem}
              draggable
              onDragStart={(e) => handleDragStart(e, group.key, item.key, item.label)}
              onDragEnd={handleDragEnd}
              onClick={() => handleComponentClick(`${group.key}-${item.key}`, item.label)}
              title={item.label}
            >
              <div className={styles.componentIcon}>
                <DatabaseOutlined />
              </div>
              <div className={styles.componentLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      )
    }))

    return (
      <div className={styles.componentsContent}>
        <Collapse
          activeKey={expandedGroups}
          onChange={(keys) => setExpandedGroups(keys as string[])}
          items={collapseItems}
          className={styles.componentCollapse}
          ghost
        />
      </div>
    )
  }

  // 树形结构渲染 - 显示画布元素层级
  const renderTree = () => {
    if (nodes.length === 0) {
      return (
        <div className={styles.treeContent}>
          <Empty
            description={t('editor.tree.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        </div>
      )
    }

    return (
      <div className={styles.treeContent}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedNodeId ? [selectedNodeId] : []}
          defaultExpandAll
          showIcon
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0) {
              selectNode(selectedKeys[0] as string)
            } else {
              selectNode(null)
            }
          }}
          blockNode
        />
      </div>
    )
  }

  const handleComponentClick = (key: string, label: string) => {
    console.log('Add component:', key, label)
    // TODO: 实现添加组件逻辑
  }

  const tabItems = [
    {
      key: 'components',
      label: (
        <span>
          <AppstoreOutlined />
          {t('editor.components')}
        </span>
      ),
      children: renderComponents()
    },
    {
      key: 'tree',
      label: (
        <span>
          <ApartmentOutlined />
          {t('editor.tree.label')}
        </span>
      ),
      children: renderTree()
    }
  ]

  return (
    <div className={`${styles.toolbox} ${className || ''}`}>
      <Tabs
        defaultActiveKey="components"
        centered
        items={tabItems}
        className={styles.tabs}
        size="small"
      />
    </div>
  )
}

export default Toolbox
